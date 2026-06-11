import { redirect } from 'next/navigation'

export default function ContactoRedirect() {
  redirect('/servicios?tab=contacto')
}
