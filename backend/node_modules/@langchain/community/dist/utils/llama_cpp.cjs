"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomGrammar = exports.createLlamaJsonSchemaGrammar = exports.createLlamaSession = exports.createLlamaContext = exports.createLlamaModel = void 0;
/* eslint-disable import/no-extraneous-dependencies */
const node_llama_cpp_1 = require("node-llama-cpp");
async function createLlamaModel(inputs, llama) {
    const options = {
        gpuLayers: inputs?.gpuLayers,
        modelPath: inputs.modelPath,
        useMlock: inputs?.useMlock,
        useMmap: inputs?.useMmap,
        vocabOnly: inputs?.vocabOnly,
    };
    return llama.loadModel(options);
}
exports.createLlamaModel = createLlamaModel;
async function createLlamaContext(model, inputs) {
    const options = {
        batchSize: inputs?.batchSize,
        contextSize: inputs?.contextSize,
        threads: inputs?.threads,
    };
    return model.createContext(options);
}
exports.createLlamaContext = createLlamaContext;
function createLlamaSession(context) {
    return new node_llama_cpp_1.LlamaChatSession({ contextSequence: context.getSequence() });
}
exports.createLlamaSession = createLlamaSession;
async function createLlamaJsonSchemaGrammar(schemaString, llama) {
    if (schemaString === undefined) {
        return undefined;
    }
    const schemaJSON = schemaString;
    return await llama.createGrammarForJsonSchema(schemaJSON);
}
exports.createLlamaJsonSchemaGrammar = createLlamaJsonSchemaGrammar;
async function createCustomGrammar(filePath, llama) {
    if (filePath === undefined) {
        return undefined;
    }
    return llama.createGrammar({
        grammar: filePath,
    });
}
exports.createCustomGrammar = createCustomGrammar;
