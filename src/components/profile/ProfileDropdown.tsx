import { User, Settings, LogOut, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export function ProfileDropdown() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const subText = profile?.company_name 
    ? `${profile.job_title || 'Member'} at ${profile.company_name}`
    : user?.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {loading ? '...' : getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {subText}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {profile?.company_name && (
          <>
            <DropdownMenuItem disabled className="opacity-70">
              <Building2 className="mr-2 h-4 w-4" />
              {profile.company_name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
