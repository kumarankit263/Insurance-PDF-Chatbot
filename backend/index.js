const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { QdrantClient } = require("@qdrant/js-client-rest");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const cors = require("cors");
dotenv.config();

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In Qdrant client initialization
const qdrant = new QdrantClient({
  url: "http://localhost:6334",
});

// Initialize Qdrant collection name
// Make sure to create the collection in Qdrant before running this code
const COLLECTION_NAME = "gemini_qdrant_test";

const createCollectionIfNeeded = async () => {
  const collections = await qdrant.getCollections();
  const exists = collections.collections?.some(
    (c) => c.name === COLLECTION_NAME
  );

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768, // Must match embedding dimension
        distance: "Cosine",
      },
    });
  }
};

// Load and parse PDF
const loadPDF = async (path) => {
  const buffer = fs.readFileSync(path);
  const data = await pdfParse(buffer);
  return data.text;
};

// Split text into chunks
const splitText = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  return await splitter.createDocuments([text]);
};
// Generate embedding for a given text
// Ensure the embedding model is correct and matches the Qdrant collection
const generateEmbedding = async (text) => {
  const embeddingModel = genAI.getGenerativeModel({
    model: "models/text-embedding-004", // 768 dimensions
  });

  // CORRECT PAYLOAD FORMAT
  const result = await embeddingModel.embedContent({
    content: {
      parts: [{ text: text }], // Required structure
    },
  });

  return result.embedding.values; // Direct array return
};

// POST endpoint to upload a PDF and process it
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    await createCollectionIfNeeded();

    const filePath = req.file.path;
    const text = await loadPDF(filePath);
    const docs = await splitText(text);
    // console.log(docs);
    const points = await Promise.all(
      docs.map(async (doc) => {
        const embedding = await generateEmbedding(doc.pageContent);
        return {
          id: uuidv4(),
          vector: embedding,
          payload: {
            pageContent: doc.pageContent,
          },
        };
      })
    );

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    res.send("PDF uploaded, embedded, and stored in Qdrant!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing file.");
  }
});

// POST endpoint to ask a question

app.post("/ask", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).send("Query is required.");
    }

    const embedding = await generateEmbedding(query);
    const vector = embedding;

    const searchResult = await qdrant.search(COLLECTION_NAME, {
      vector,
      top: 5,
    });

    const context = searchResult
      .map((hit) => hit.payload.pageContent)
      .join("\n");

    const systemPrompt = `
    You are an insurance policy assistant. Use the following context to answer the user's question. If the answer is not in the context, say "I'm not sure, let me connect you to a human agent."
    
    Context:
    ${context}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: query }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await result.response;
    let text = await response.text();

    if (
      text.toLowerCase().includes("i'm not sure") ||
      text.toLowerCase().includes("connect you to a human")
    ) {
      text = "I'm not sure, let me connect you to a human agent for further assistance.";
      return res.json({ message: text });
    }
    const parsed = JSON.parse(text);
    // console.log(parsed);
    res.json({ message: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve and answer.");
  }
});

app.listen(port, () => {
  console.log(`Gemini Qdrant app running at http://localhost:${port}`);
});
