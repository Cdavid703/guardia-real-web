import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const db = getAdminDb()
    const ref = db.collection('stats').doc('visits')
    const [totalSnap, todaySnap] = await Promise.all([
      ref.get(),
      ref.collection('daily').doc(todayKey()).get(),
    ])
    return NextResponse.json({
      total: totalSnap.data()?.total ?? 0,
      today: todaySnap.data()?.count ?? 0,
    })
  } catch {
    return NextResponse.json({ total: 0, today: 0 })
  }
}

export async function POST() {
  try {
    const db = getAdminDb()
    const ref = db.collection('stats').doc('visits')
    const key = todayKey()

    await Promise.all([
      ref.set({ total: FieldValue.increment(1) }, { merge: true }),
      ref.collection('daily').doc(key).set({ date: key, count: FieldValue.increment(1) }, { merge: true }),
    ])

    const [totalSnap, todaySnap] = await Promise.all([
      ref.get(),
      ref.collection('daily').doc(key).get(),
    ])

    return NextResponse.json({
      total: totalSnap.data()?.total ?? 0,
      today: todaySnap.data()?.count ?? 0,
    })
  } catch {
    return NextResponse.json({ total: 0, today: 0 }, { status: 500 })
  }
}
