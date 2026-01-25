// Force dynamic rendering to prevent file system writes on Render
export const dynamic = 'force-dynamic'

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
