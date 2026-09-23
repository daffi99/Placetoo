import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    test: true,
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    nodeVersion: process.version,
  });
}
