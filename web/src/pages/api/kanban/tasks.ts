import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), '..', '..', 'data', 'tasks_source.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.status(200).json({ tasks: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tasks', details: String(err) });
  }
}
