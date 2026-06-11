import { redirect } from 'next/navigation'

export default function ContratarRedirect() {
  redirect('/servicios?tab=contratantes')
}
