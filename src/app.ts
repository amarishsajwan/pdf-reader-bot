import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { RetrievalQAChain } from "langchain/chains";
import * as dotenv from "dotenv";
dotenv.config();

const loader = new PDFLoader("src/documents/budget_speech.pdf");

const docs = await loader.load();

//splitter function
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 20,
});

//chunks
const splittedDocs = await splitter.splitDocuments(docs);
const embeddings = new OpenAIEmbeddings();

// Create a vector store from the documents.
const vectorStore = await HNSWLib.fromDocuments(splittedDocs, embeddings);

// Initialize a retriever wrapper around the vector store
const vectorStoreRetriever = vectorStore.asRetriever();

// Initialize the LLM to use to answer the question.
const model = new OpenAI({
  modelName: "gpt-3.5-turbo-instruct",
});

// Create a chain that uses the OpenAI LLM and HNSWLib vector store.
const chain = RetrievalQAChain.fromLLM(model, vectorStoreRetriever);

const question = "What is the theme of G20?";
const answer = await chain.invoke({
  query: question,
});

console.log(answer);
