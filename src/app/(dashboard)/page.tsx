import { redirect } from 'next/navigation'

// The dashboard root redirects to the canvas editor
export default function DashboardPage() {
  redirect('/canvas')
}
