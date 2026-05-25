import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEmployeePhoto } from '@/hooks/useEmployeePhotos';
import { cn } from '@/lib/utils';

interface EmployeeAvatarProps {
  email?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const getInitials = (name?: string | null, email?: string | null) => {
  const source = (name || email || '?').trim();
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const EmployeeAvatar = ({ email, name, className, fallbackClassName }: EmployeeAvatarProps) => {
  const photoUrl = useEmployeePhoto(email);
  return (
    <Avatar className={cn('h-7 w-7 shrink-0', className)}>
      <AvatarImage src={photoUrl} />
      <AvatarFallback className={cn('text-xs', fallbackClassName)}>
        {getInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  );
};

export default EmployeeAvatar;
