import { redirect } from 'next/navigation'

export default function UniformesRedirect() {
  redirect('/integrantes?tab=uniformes')
}
