interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: number
}

export default function Avatar({ name, avatarUrl, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="avatar font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}
