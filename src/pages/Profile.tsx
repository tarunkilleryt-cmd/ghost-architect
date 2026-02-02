import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Building2, Briefcase, MapPin, Globe, FileText, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileData {
  display_name: string;
  company_name: string;
  job_title: string;
  bio: string;
  website: string;
  location: string;
  avatar_url: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    company_name: '',
    job_title: '',
    bio: '',
    website: '',
    location: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          company_name: data.company_name || '',
          job_title: data.job_title || '',
          bio: data.bio || '',
          website: data.website || '',
          location: data.location || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name || null,
          company_name: profile.company_name || null,
          job_title: profile.job_title || null,
          bio: profile.bio || null,
          website: profile.website || null,
          location: profile.location || null,
          avatar_url: profile.avatar_url || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to save profile');
        return;
      }

      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="mx-auto h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{profile.display_name || 'Your Name'}</CardTitle>
              <CardDescription>
                {profile.job_title && profile.company_name 
                  ? `${profile.job_title} at ${profile.company_name}`
                  : profile.job_title || profile.company_name || user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Display Name
                  </Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar_url"
                    value={profile.avatar_url}
                    onChange={(e) => handleChange('avatar_url', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <Separator />

              {/* Work Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    value={profile.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Title
                  </Label>
                  <Input
                    id="job_title"
                    value={profile.job_title}
                    onChange={(e) => handleChange('job_title', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <Separator />

              {/* Location & Website */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <Separator />

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="mt-1 font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="mt-1 font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
