// Force dynamic rendering to prevent file system writes on Render
export const dynamic = 'force-dynamic'

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
