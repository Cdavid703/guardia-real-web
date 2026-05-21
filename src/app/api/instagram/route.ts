import { NextResponse } from 'next/server'

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ error: 'no_token' }, { status: 503 })
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=24&access_token=${TOKEN}`
    const res  = await fetch(url, { next: { revalidate: 3600 } }) // cache 1h
    if (!res.ok) throw new Error(`Instagram API ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Instagram fetch error:', err)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }
}
