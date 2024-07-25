import { createPool } from "@vercel/postgres";
import { Address, parseEther } from "viem";

export interface Transaction {
    id?: number;                  // 唯一标识符
    chainId: number;              // 链ID
    address: Address;             // 地址
    nonce: bigint;                // 交易序号
    txTo: Address;                // 目标地址
    amount: string;               // 交易金额
    data?: `0x${string}`;         // 附加数据
    hash: `0x${string}`;          // 交易哈希
    signatures: `0x${string}`[];  // 签名数组
    signers: Address[];           // 签名者数组
    validSignatures?: { signer: Address; signature: Address }[];
    requiredApprovals: bigint;    // 所需批准数量
    ctime?: Date;                 // 创建时间
    mtime?: Date;                 // 修改时间
}

const pool = createPool({
    connectionString: process.env.POSTGRES_PRISMA_URL, // 确保你的数据库连接字符串正确
});

export async function getTransactions(
    { chainId, address }: Transaction
) {
    const client = await pool.connect();
    try {
        const result = await client.query<Transaction>(`
            SELECT * FROM transaction_tab
            WHERE "chainId" = $1 AND address = $2;
        `, [chainId, address]);
        if (result.rows.length > 0) {
            console.log('Transactions found:', result.rows);
            return result.rows; // 返回所有找到的记录
        } else {
            console.log('No transactions found for the given chainId and address.');
            return []; // 返回空数组表示没有找到记录
        }
    } catch (error) {
        console.error('Error querying transactions:', error);
        throw error; // 抛出错误以便调用者处理
    } finally {
        // client.release();
    }
}

export async function insertTransaction(tx: Transaction) {
    const client = await pool.connect();
    const template = `
        INSERT INTO transaction_tab (
            "chainId",
            address,
            nonce,
            "txTo",
            amount,
            data,
            hash,
            signatures,
            signers,
            "requiredApprovals",
            ctime,
            mtime
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id;
    `;
    try {
        const result = await client.query(template, [
            tx.chainId,          // chainId
            tx.address,          // address
            tx.nonce,            // nonce
            tx.txTo,             // txTo
            tx.amount,           // amount
            tx.data,             // data
            tx.hash,             // hash
            tx.signatures,       // signatures (数组)
            tx.signers,          // signers (数组)
            tx.requiredApprovals // requiredApprovals
        ]);
        console.log('Inserted transaction with ID:', result.rows[0].id);
    } catch (error) {
        console.error('Error Inserted transaction:', error);
        throw error; // 抛出错误以便调用者处理
    } finally {
        client.release();
    }
}

export async function updateSignaturesAndSigners(
    { id, signatures, signers }: Transaction
) {
    const client = await pool.connect();
    const template = `
        UPDATE transaction_tab
        SET 
            signatures = $1,
            signers = $2,
            mtime = CURRENT_TIMESTAMP
        WHERE id = $3;
    `;
    try {
        await client.query(template, [signatures, signers, id]);

        console.log(`Updated signatures and signers for id: ${id}`);
    } catch (error) {
        console.error('Error updating signatures and signers:', error);
        throw error; // 抛出错误以便调用者处理
    } finally {
        client.release();
    }
}
