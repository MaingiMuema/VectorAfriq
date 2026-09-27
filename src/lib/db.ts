import mysql from "mysql2/promise";

// Define types for database operations
export type DatabaseValue = string | number | boolean | null | Date;
export type QueryParams = DatabaseValue[];
export type QueryResult = Record<string, DatabaseValue>;

// MySQL error type
interface MySQLError extends Error {
  code: string;
  errno: number;
  sqlState: string;
  sqlMessage: string;
  sql?: string;
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "propertyfinder",
  waitForConnections: true,
  connectionLimit: 250, // Optimal pool size for high concurrency
  queueLimit: 0, // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000, // Increased timeout for connections
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper to execute SQL queries with retry logic
export async function query<T = QueryResult>(
  sql: string,
  params: QueryParams = [],
  retryCount = 0
): Promise<T[]> {
  let connection;
  try {
    // Get a connection from the pool with retry logic
    connection = await getConnectionWithRetry();

    // Execute the query
    const [rows] = await connection.execute(sql, params);



    return rows as T[];
  } catch (error) {
    // Release the connection before handling the error
    if (connection) {
      connection.release();
      connection = undefined;
    }

    // Log the basic error first
    console.error("Database query error:", {
      sql,
      params,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      retryCount,
    });

    if (error instanceof Error) {
      const mysqlError = error as MySQLError;
      console.error("MySQL Error Details:", {
        type: "MySQL Error",
        errorMessage: mysqlError.message,
        errorCode: mysqlError.code,
        errorNumber: mysqlError.errno,
        sqlState: mysqlError.sqlState,
        sqlMessage: mysqlError.sqlMessage,
        sql: mysqlError.sql,
        stack: mysqlError.stack,
      });

      // Handle connection-related errors with retry logic
      if (
        retryCount < MAX_RETRIES &&
        (mysqlError.errno === 1040 || // Too many connections
          mysqlError.errno === 1205 || // Lock wait timeout
          mysqlError.errno === 1213) // Deadlock
      ) {
        console.log(
          `Retrying query (attempt ${retryCount + 1}/${MAX_RETRIES})...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (retryCount + 1))
        );
        return query(sql, params, retryCount + 1);
      }

      // Handle specific MySQL errors
      if (mysqlError.errno === 1062) {
        throw new Error("Duplicate entry");
      } else if (mysqlError.errno === 1054) {
        throw new Error("Invalid column name");
      } else if (mysqlError.errno === 1146) {
        throw new Error("Table does not exist");
      }
    }

    throw error;
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
}

// Utility function to wait between retries
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to handle connection acquisition with exponential backoff
async function getConnectionWithRetry(
  retryCount = 0
): Promise<mysql.PoolConnection> {
  const MAX_CONNECTION_RETRIES = 5;
  const BASE_DELAY = 1000; // 1 second

  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    const mysqlError = error as MySQLError;
    console.error("Connection acquisition error:", {
      attempt: retryCount + 1,
      message: mysqlError.message,
      code: mysqlError.code,
    });

    // Only retry on too many connections error
    if (retryCount < MAX_CONNECTION_RETRIES && mysqlError.errno === 1040) {
      const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(
        `Retrying connection acquisition in ${delay}ms... (attempt ${retryCount + 1
        }/${MAX_CONNECTION_RETRIES})`
      );
      await wait(delay);
      return getConnectionWithRetry(retryCount + 1);
    }

    throw error;
  }
}

// Export database interface with improved connection handling
const db = {
  pool,
  query,
  getConnectionWithRetry,
};

export default db;
