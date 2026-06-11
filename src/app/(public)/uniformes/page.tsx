import { redirect } from 'next/navigation'

export default function UniformesRedirect() {
  redirect('/dashboard/equipo?tab=uniformes')
}
