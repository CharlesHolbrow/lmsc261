import Image from "next/image";

interface Profile {
  picture?: string;
  name: string;
}

export default function ProfileIcon({ 
  profile, 
  className = "" 
}: {
  profile: Profile;
  className?: string;
}) {
  if (!profile.picture) {
    const initial = profile.name.charAt(0).toUpperCase();
    return (
      <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 ${className}`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={`relative w-8 h-8 ${className}`}>
      <Image
        src={profile.picture}
        alt={`${profile.name}'s profile`}
        fill
        className="rounded-full object-cover"
      />
    </div>
  );
}
