import { getCrawledTracks } from '@/lib/data'
import { ProfileForm } from '@/components/ProfileForm'

export const metadata = { title: 'Scoring profile' }

export default async function ProfilePage() {
  const tracks = await getCrawledTracks()
  return <ProfileForm tracks={tracks} />
}
