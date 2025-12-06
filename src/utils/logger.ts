import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const logPath = path.join(process.cwd(),"logs", "request.csv");

// Write CSV header once
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(
    logPath,
    "timestamp,method,path,status,response_bytes,duration_ms\n"
  );
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = process.hrtime.bigint();
  let responseSize = 0;

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = ((chunk: any, ...args: any[]) => {
    if (chunk) responseSize += Buffer.byteLength(chunk);
    return originalWrite(chunk, ...args);
  }) as any;

  res.end = ((chunk: any, ...args: any[]) => {
    if (chunk) responseSize += Buffer.byteLength(chunk);
    return originalEnd(chunk, ...args);
  }) as any;

  res.on("finish", () => {
    const durationMs =
      Number(process.hrtime.bigint() - start) / 1_000_000;

    const line = [
      new Date().toISOString(),
      req.method,
      `"${req.originalUrl.replace(/"/g, '""')}"`,
      res.statusCode,
      responseSize,
      durationMs.toFixed(2),
    ].join(",");

    fs.appendFile(logPath, line + "\n", () => {});
  });

  next();
}
