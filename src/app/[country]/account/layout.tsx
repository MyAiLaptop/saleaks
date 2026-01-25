// Force dynamic rendering to prevent file system writes on Render
export const dynamic = 'force-dynamic'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
