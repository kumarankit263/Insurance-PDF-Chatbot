import { z } from "zod";
import { CallbackManagerForToolRun, Callbacks } from "../callbacks/manager.js";
import { BaseLangChain } from "../language_models/base.js";
import { type RunnableConfig } from "../runnables/config.js";
import type { RunnableFunc } from "../runnables/base.js";
import { ToolCall } from "../messages/tool.js";
import { ToolInputParsingException } from "./utils.js";
import type { StructuredToolCallInput, ToolInputSchemaBase, ToolReturnType, ResponseFormat, ToolInputSchemaInputType, ToolInputSchemaOutputType, ToolParams, ToolRunnableConfig, StructuredToolInterface, DynamicToolInput, DynamicStructuredToolInput, ZodObjectAny } from "./types.js";
import { type JSONSchema } from "../utils/json_schema.js";
export type { BaseDynamicToolInput, ContentAndArtifact, DynamicToolInput, DynamicStructuredToolInput, isLangChainTool, isRunnableToolLike, isStructuredTool, isStructuredToolParams, ResponseFormat, StructuredToolCallInput, StructuredToolInterface, StructuredToolParams, ToolInterface, ToolParams, ToolReturnType, ToolRunnableConfig, ToolInputSchemaBase as ToolSchemaBase, } from "./types.js";
export { ToolInputParsingException };
/**
 * Base class for Tools that accept input of any shape defined by a Zod schema.
 */
export declare abstract class StructuredTool<SchemaT extends ToolInputSchemaBase = ZodObjectAny, SchemaOutputT = ToolInputSchemaOutputType<SchemaT>, SchemaInputT = ToolInputSchemaInputType<SchemaT>> extends BaseLangChain<StructuredToolCallInput<SchemaT, SchemaInputT>, ToolReturnType> {
    abstract name: string;
    abstract description: string;
    abstract schema: SchemaT;
    /**
     * Whether to return the tool's output directly.
     *
     * Setting this to true means that after the tool is called,
     * an agent should stop looping.
     */
    returnDirect: boolean;
    verboseParsingErrors: boolean;
    get lc_namespace(): string[];
    /**
     * The tool response format.
     *
     * If "content" then the output of the tool is interpreted as the contents of a
     * ToolMessage. If "content_and_artifact" then the output is expected to be a
     * two-tuple corresponding to the (content, artifact) of a ToolMessage.
     *
     * @default "content"
     */
    responseFormat?: ResponseFormat;
    constructor(fields?: ToolParams);
    protected abstract _call(arg: SchemaOutputT, runManager?: CallbackManagerForToolRun, parentConfig?: ToolRunnableConfig): Promise<ToolReturnType>;
    /**
     * Invokes the tool with the provided input and configuration.
     * @param input The input for the tool.
     * @param config Optional configuration for the tool.
     * @returns A Promise that resolves with a string.
     */
    invoke(input: StructuredToolCallInput<SchemaT, SchemaInputT>, config?: RunnableConfig): Promise<ToolReturnType>;
    /**
     * @deprecated Use .invoke() instead. Will be removed in 0.3.0.
     *
     * Calls the tool with the provided argument, configuration, and tags. It
     * parses the input according to the schema, handles any errors, and
     * manages callbacks.
     * @param arg The input argument for the tool.
     * @param configArg Optional configuration or callbacks for the tool.
     * @param tags Optional tags for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg: StructuredToolCallInput<SchemaT, SchemaInputT>, configArg?: Callbacks | ToolRunnableConfig, 
    /** @deprecated */
    tags?: string[]): Promise<ToolReturnType>;
}
/**
 * Base class for Tools that accept input as a string.
 */
export declare abstract class Tool extends StructuredTool<z.ZodEffects<z.ZodObject<{
    input: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, any, any>, any, any>> {
    schema: z.ZodEffects<z.ZodObject<{
        input: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        input?: string | undefined;
    }, {
        input?: string | undefined;
    }>, string | undefined, {
        input?: string | undefined;
    }>;
    constructor(fields?: ToolParams);
    /**
     * @deprecated Use .invoke() instead. Will be removed in 0.3.0.
     *
     * Calls the tool with the provided argument and callbacks. It handles
     * string inputs specifically.
     * @param arg The input argument for the tool, which can be a string, undefined, or an input of the tool's schema.
     * @param callbacks Optional callbacks for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg: string | undefined | z.input<this["schema"]> | ToolCall, callbacks?: Callbacks | RunnableConfig): Promise<ToolReturnType>;
}
/**
 * A tool that can be created dynamically from a function, name, and description.
 */
export declare class DynamicTool extends Tool {
    static lc_name(): string;
    name: string;
    description: string;
    func: DynamicToolInput["func"];
    constructor(fields: DynamicToolInput);
    /**
     * @deprecated Use .invoke() instead. Will be removed in 0.3.0.
     */
    call(arg: string | undefined | z.input<this["schema"]> | ToolCall, configArg?: ToolRunnableConfig | Callbacks): Promise<ToolReturnType>;
    /** @ignore */
    _call(input: string, runManager?: CallbackManagerForToolRun, parentConfig?: ToolRunnableConfig): Promise<ToolReturnType>;
}
/**
 * A tool that can be created dynamically from a function, name, and
 * description, designed to work with structured data. It extends the
 * StructuredTool class and overrides the _call method to execute the
 * provided function when the tool is called.
 *
 * Schema can be passed as Zod or JSON schema. The tool will not validate
 * input if JSON schema is passed.
 */
export declare class DynamicStructuredTool<SchemaT extends ToolInputSchemaBase = ZodObjectAny, SchemaOutputT = ToolInputSchemaOutputType<SchemaT>, SchemaInputT = ToolInputSchemaInputType<SchemaT>> extends StructuredTool<SchemaT, SchemaOutputT, SchemaInputT> {
    static lc_name(): string;
    name: string;
    description: string;
    func: DynamicStructuredToolInput<SchemaT, SchemaOutputT>["func"];
    schema: SchemaT;
    constructor(fields: DynamicStructuredToolInput<SchemaT, SchemaOutputT>);
    /**
     * @deprecated Use .invoke() instead. Will be removed in 0.3.0.
     */
    call(arg: StructuredToolCallInput<SchemaT, SchemaInputT>, configArg?: RunnableConfig | Callbacks, 
    /** @deprecated */
    tags?: string[]): Promise<ToolReturnType>;
    protected _call(arg: Parameters<DynamicStructuredToolInput<SchemaT, SchemaOutputT>["func"]>[0], runManager?: CallbackManagerForToolRun, parentConfig?: RunnableConfig): Promise<ToolReturnType>;
}
/**
 * Abstract base class for toolkits in LangChain. Toolkits are collections
 * of tools that agents can use. Subclasses must implement the `tools`
 * property to provide the specific tools for the toolkit.
 */
export declare abstract class BaseToolkit {
    abstract tools: StructuredToolInterface[];
    getTools(): StructuredToolInterface[];
}
/**
 * Parameters for the tool function.
 * Schema can be provided as Zod or JSON schema.
 * Both schema types will be validated.
 * @template {ZodObjectAny | z.ZodString | JSONSchema = ZodObjectAny} RunInput The input schema for the tool. Either any Zod object, a Zod string, or JSON schema.
 */
interface ToolWrapperParams<RunInput extends ZodObjectAny | z.ZodString | JSONSchema = ZodObjectAny> extends ToolParams {
    /**
     * The name of the tool. If using with an LLM, this
     * will be passed as the tool name.
     */
    name: string;
    /**
     * The description of the tool.
     * @default `${fields.name} tool`
     */
    description?: string;
    /**
     * The input schema for the tool. If using an LLM, this
     * will be passed as the tool schema to generate arguments
     * for.
     */
    schema?: RunInput;
    /**
     * The tool response format.
     *
     * If "content" then the output of the tool is interpreted as the contents of a
     * ToolMessage. If "content_and_artifact" then the output is expected to be a
     * two-tuple corresponding to the (content, artifact) of a ToolMessage.
     *
     * @default "content"
     */
    responseFormat?: ResponseFormat;
    /**
     * Whether to return the tool's output directly.
     *
     * Setting this to true means that after the tool is called,
     * an agent should stop looping.
     */
    returnDirect?: boolean;
}
/**
 * Creates a new StructuredTool instance with the provided function, name, description, and schema.
 *
 * Schema can be provided as Zod or JSON schema, and both will be validated.
 *
 * @function
 * @template {ZodObjectAny | z.ZodString | JSONSchema = ZodObjectAny} SchemaT The input schema for the tool. Either any Zod object, a Zod string, or JSON schema instance.
 *
 * @param {RunnableFunc<z.output<SchemaT>, ToolReturnType>} func - The function to invoke when the tool is called.
 * @param {ToolWrapperParams<SchemaT>} fields - An object containing the following properties:
 * @param {string} fields.name The name of the tool.
 * @param {string | undefined} fields.description The description of the tool. Defaults to either the description on the Zod schema, or `${fields.name} tool`.
 * @param {ZodObjectAny | z.ZodString | undefined} fields.schema The Zod schema defining the input for the tool. If undefined, it will default to a Zod string schema.
 *
 * @returns {DynamicStructuredTool<SchemaT>} A new StructuredTool instance.
 */
export declare function tool<SchemaT extends z.ZodString>(func: RunnableFunc<SchemaT extends z.ZodString ? z.output<SchemaT> : string, ToolReturnType, ToolRunnableConfig>, fields: ToolWrapperParams<SchemaT>): DynamicTool;
export declare function tool<SchemaT extends ZodObjectAny, SchemaOutputT = z.output<SchemaT>, SchemaInputT = z.input<SchemaT>>(func: RunnableFunc<SchemaOutputT, ToolReturnType, ToolRunnableConfig>, fields: ToolWrapperParams<SchemaT>): DynamicStructuredTool<SchemaT, SchemaOutputT, SchemaInputT>;
export declare function tool<SchemaT extends JSONSchema, SchemaOutputT = ToolInputSchemaOutputType<SchemaT>, SchemaInputT = ToolInputSchemaInputType<SchemaT>>(func: RunnableFunc<Parameters<DynamicStructuredToolInput<SchemaT>["func"]>[0], ToolReturnType, ToolRunnableConfig>, fields: ToolWrapperParams<SchemaT>): DynamicStructuredTool<SchemaT, SchemaOutputT, SchemaInputT>;
