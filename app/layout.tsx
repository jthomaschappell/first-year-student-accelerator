import './globals.css'

export const metadata = {
  title: 'First Year Student Accelerator',
  description: 'Your unified academic productivity hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
