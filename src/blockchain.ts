import crypto from "crypto-js";
import { DIFFICULTY } from "./constants/env";

export class Block<T = any> {
  private index: number;
  private previousHash: string;
  private timestamp: number;
  private data: T
  private hash: string;
  private difficulty: number;
  private nonce: number;

  public constructor(index: number, previousHash: string, timestamp: number, data: T, hash: string, difficulty: number, nonce: number) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }

  public getIndex(): number {
    return this.index;
  }

  public getPreviousHash(): string {
    return this.previousHash;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public getData(): T {
    return this.data;
  }

  public getHash(): string {
    return this.hash;
  }

  public getDifficulty(): number {
    return this.difficulty;
  }

  public getNonce(): number {
    return this.nonce;
  }
}

export class BlockGenerator {
  public createGenesisBlock(): Block {
    return new Block<string>(
      0, "0", 1682839690, "RUT-MIIT first block",
      "8d9d5a7ff4a78042ea6737bf59c772f8ed27ef3c9b576eac1976c91aaf48d2de",
      0, 0
    );
  }

  // public generateNext<T>(data: T, blockchain: Blockchain): Block<T> | null {
  //   const previousBlock = blockchain.getLatestBlock();
  //   const nextBlockIndex = blockchain.getNextIndex();
  //   const nextBlockTimestamp = this.calculateTimestamp();
  //   const nextBlockHash = this.calculateHash(nextBlockIndex, previousBlock.getHash(), nextBlockTimestamp, data);

  //   return new Block<T>(nextBlockIndex, previousBlock.getHash(), nextBlockTimestamp, data, nextBlockHash);
  // }

  public mineBlock<T>(data: T, blockchain: Blockchain): Block {
    const previousBlock = blockchain.getLatestBlock();
    const nextBlockIndex = blockchain.getNextIndex();

    let nonce = 0;
    let nextBlockTimestamp = this.calculateTimestamp();
    let nextBlockHash = this.calculateHash(nextBlockIndex, previousBlock.getHash(), nextBlockTimestamp, data, nonce);

    while (nextBlockHash.substring(0, DIFFICULTY) !== Array(DIFFICULTY + 1).join("0")) {
      nonce++;

      nextBlockTimestamp = this.calculateTimestamp();
      nextBlockHash = this.calculateHash(nextBlockIndex, previousBlock.getHash(), nextBlockTimestamp, data, nonce);

      console.log({
        index: nextBlockIndex,
        previousHash: previousBlock.getHash(),
        timestamp: nextBlockTimestamp,
        nextHash: nextBlockHash,
        nonce
      });
    }

    return new Block<T>(nextBlockIndex, previousBlock.getHash(), nextBlockTimestamp, data, nextBlockHash, DIFFICULTY, nonce);
  }

  public calculateHashForBlock(block: Block): string {
    return this.calculateHash(block.getIndex(), block.getPreviousHash(), block.getTimestamp(), block.getData(), block.getNonce());
  }

  public calculateHash(index: number, previousBlockHash: string, timestamp: number, data: any, nonce: number): string {
    return crypto.SHA256(index + previousBlockHash + timestamp + data + nonce).toString();
  }

  private calculateTimestamp(): number {
    return new Date().getTime() / 1000;
  }
}

export class Blockchain {
  private static _instance: Blockchain | null;

  private _blocks: Block[] = [];

  public static getInstance(): Blockchain {
    if (!this._instance) {
      const blockGenerator = new BlockGenerator();

      this._instance = new Blockchain();
      this._instance._blocks.push(blockGenerator.createGenesisBlock());
    }

    return this._instance;
  }

  private constructor() { }

  public get blocks(): Block[] {
    return this._blocks;
  }

  public addBlock(block: Block): void {
    if (this.isValidBlock(block, this.getLatestBlock())) {
      this._blocks.push(block);
    }
  }

  public replaceChain(newBlocks: Block[]): boolean {
    if (this.isValidChain(newBlocks) && newBlocks.length > this.blocks.length) {
      console.log("Received blockchain is valid, replacing current blockchain with received blockchain");

      // Mutate current state instead of replacing the reference
      this._blocks.splice(0, this._blocks.length);
      newBlocks.forEach(block => this._blocks.push(block));

      return true;
    }

    console.log("Received blockchain is invalid, do nothing");
    return false;
  }

  public getLatestBlock(): Block {
    // Note: we always have the genesis block in the blockchain,
    // so this method will always return a valid block, not `undefined`
    return this._blocks[this._blocks.length - 1]!;
  }

  public getNextIndex(): number {
    return this._blocks.length;
  }

  private isValidChain(blocks: Block[]): boolean {
    if (JSON.stringify(blocks[0]) !== JSON.stringify(new BlockGenerator().createGenesisBlock())) {
      return false;
    }

    // Note: thorough check all the way down is necessary as indexes might be out of range
    const tempBlocks: Block[] = [blocks[0]!];

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i]!;

      if (this.isValidBlock(currentBlock, tempBlocks[i - 1]!)) {
        tempBlocks.push(currentBlock);
      } else {
        return false;
      }
    }

    return true;
  }

  private isValidBlock(newBlock: Block, previousBlock: Block): boolean {
    if (previousBlock.getIndex() + 1 !== newBlock.getIndex()) {
      console.log(`Invalid index: previous block index = ${previousBlock.getIndex()}, new block index = ${newBlock.getIndex()}`);

      return false;
    }

    if (previousBlock.getHash() !== newBlock.getPreviousHash()) {
      console.log(`Invalid previous hash: ${previousBlock.getHash()}(valid) != ${newBlock.getPreviousHash()}`);

      return false;
    }

    const referenceNewHash = new BlockGenerator().calculateHashForBlock(newBlock);

    if (referenceNewHash !== newBlock.getHash()) {
      console.log(
        `Invalid hash: reference hash ${referenceNewHash} does not match with the provided block hash: ${newBlock.getHash()}`
      );

      return false;
    }

    return true;
  }
}
