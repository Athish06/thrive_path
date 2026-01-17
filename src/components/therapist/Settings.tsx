import * as React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import {
  User,
  Settings as SettingsIcon,
  Clock,
  Bell,
  Shield,
  Camera,
  Save,
  Plus,
  Trash2,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface WorkingHours {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface FreeHours {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

interface TherapistProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bio: string;
  avatar: string;

  // Professional Information
  specialization: string;
  yearsOfExperience: string;
  licenseNumber: string;
  certifications: string[];
  education: string;

  // Working Hours
  workingHours: WorkingHours[];

  // Free Hours
  freeHours: FreeHours[];

  // Notification Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionReminders: boolean;
  progressUpdates: boolean;

  // Privacy Settings
  profileVisibility: 'public' | 'therapists-only' | 'private';
  dataSharing: boolean;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const SPECIALIZATIONS = [
  'Speech-Language Pathology',
  'Occupational Therapy',
  'Physical Therapy',
  'Behavioral Therapy',
  'Developmental Pediatrics',
  'Special Education',
  'Clinical Psychology',
  'Other'
];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);

  // Load settings on component mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsLoadingSettings(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const settingsData = await response.json();
          
          // Update profile state with loaded data
          if (settingsData.profile_section) {
            setProfile(prev => ({
              ...prev,
              ...settingsData.profile_section
            }));
          }
          
          if (settingsData.account_section) {
            setProfile(prev => ({
              ...prev,
              ...settingsData.account_section
            }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);
  const [profile, setProfile] = React.useState<TherapistProfile>({
    // Personal Information
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    bio: '',
    avatar: '',

    // Professional Information
    specialization: '',
    yearsOfExperience: '',
    licenseNumber: '',
    certifications: [],
    education: '',

    // Working Hours (default business hours)
    workingHours: DAYS_OF_WEEK.map(day => ({
      day,
      startTime: day === 'Saturday' || day === 'Sunday' ? '09:00' : '08:00',
      endTime: day === 'Saturday' || day === 'Sunday' ? '17:00' : '18:00',
      enabled: day !== 'Saturday' && day !== 'Sunday'
    })),

    // Free Hours (initially empty)
    freeHours: [],

    // Notification Preferences
    emailNotifications: true,
    smsNotifications: false,
    sessionReminders: true,
    progressUpdates: true,

    // Privacy Settings
    profileVisibility: 'therapists-only',
    dataSharing: false
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      if (activeTab === 'profile') {
        // Save profile section data
        const profileData = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          bio: profile.bio,
          avatar: profile.avatar,
          specialization: profile.specialization,
          yearsOfExperience: profile.yearsOfExperience,
          licenseNumber: profile.licenseNumber,
          certifications: profile.certifications,
          education: profile.education
        };

        const response = await fetch('http://localhost:8000/api/settings/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settings: profileData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to save profile settings');
        }

        console.log('Profile settings saved successfully');
      } else if (activeTab === 'account') {
        // Save account section data
        const accountData = {
          workingHours: profile.workingHours,
          freeHours: profile.freeHours,
          emailNotifications: profile.emailNotifications,
          smsNotifications: profile.smsNotifications,
          sessionReminders: profile.sessionReminders,
          progressUpdates: profile.progressUpdates,
          profileVisibility: profile.profileVisibility,
          dataSharing: profile.dataSharing
        };

        const response = await fetch('http://localhost:8000/api/settings/account', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settings: accountData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to save account settings');
        }

        console.log('Account settings saved successfully');
      }

      // Show success message (you could add a toast notification here)
      alert(`${activeTab === 'profile' ? 'Profile' : 'Account'} settings saved successfully!`);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Failed to save ${activeTab} settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (field: keyof TherapistProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateWorkingHours = (day: string, field: keyof WorkingHours, value: any) => {
    setProfile(prev => ({
      ...prev,
      workingHours: prev.workingHours.map(hour =>
        hour.day === day ? { ...hour, [field]: value } : hour
      )
    }));
  };

  const addFreeHour = () => {
    const newFreeHour: FreeHours = {
      id: Date.now().toString(),
      day: 'Monday',
      startTime: '14:00',
      endTime: '16:00',
      purpose: 'Consultation'
    };
    setProfile(prev => ({
      ...prev,
      freeHours: [...prev.freeHours, newFreeHour]
    }));
  };

  const updateFreeHour = (id: string, field: keyof FreeHours, value: any) => {
    setProfile(prev => ({
      ...prev,
      freeHours: prev.freeHours.map(hour =>
        hour.id === id ? { ...hour, [field]: value } : hour
      )
    }));
  };

  const removeFreeHour = (id: string) => {
    setProfile(prev => ({
      ...prev,
      freeHours: prev.freeHours.filter(hour => hour.id !== id)
    }));
  };

  const addCertification = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const updateCertification = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }));
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your profile, account preferences, and availability
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading settings...</p>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture Card */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Profile Picture
                    </CardTitle>
                    <CardDescription>
                      Upload a professional photo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar} alt="Profile" />
                        <AvatarFallback className="text-lg">
                          {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => updateProfile('firstName', e.target.value)}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => updateProfile('lastName', e.target.value)}
                          placeholder="Enter your last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => updateProfile('email', e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => updateProfile('phone', e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <CustomDatePicker
                          value={profile.dateOfBirth}
                          onChange={(date) => updateProfile('dateOfBirth', date)}
                          placeholder="Select your date of birth"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profile.bio}
                          onChange={(e) => updateProfile('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Your professional credentials and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select value={profile.specialization} onValueChange={(value) => updateProfile('specialization', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map(spec => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Input
                        id="yearsOfExperience"
                        value={profile.yearsOfExperience}
                        onChange={(e) => updateProfile('yearsOfExperience', e.target.value)}
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={profile.licenseNumber}
                        onChange={(e) => updateProfile('licenseNumber', e.target.value)}
                        placeholder="Enter your license number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        value={profile.education}
                        onChange={(e) => updateProfile('education', e.target.value)}
                        placeholder="e.g., Master's in Speech Therapy"
                      />
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Certifications</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCertification}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certification
                      </Button>
                    </div>
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={cert}
                          onChange={(e) => updateCertification(index, e.target.value)}
                          placeholder="Enter certification"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCertification(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              {/* Working Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>
                    Set your regular working hours for each day
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Weekend Toggle */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Weekend Availability</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable working hours for Saturday and Sunday
                      </p>
                    </div>
                    <Switch
                      checked={profile.workingHours.filter(h => ['Saturday', 'Sunday'].includes(h.day)).some(h => h.enabled)}
                      onCheckedChange={(checked) => {
                        setProfile(prev => ({
                          ...prev,
                          workingHours: prev.workingHours.map(hour =>
                            ['Saturday', 'Sunday'].includes(hour.day)
                              ? { ...hour, enabled: checked }
                              : hour
                          )
                        }));
                      }}
                    />
                  </div>

                  {/* Individual Day Toggles */}
                  {profile.workingHours
                    .filter(hours => {
                      const isWeekendDay = ['Saturday', 'Sunday'].includes(hours.day);
                      const weekendEnabled = profile.workingHours.filter(h => ['Saturday', 'Sunday'].includes(h.day)).some(h => h.enabled);
                      return !isWeekendDay || weekendEnabled;
                    })
                    .map((hours) => (
                    <div key={hours.day} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-24">
                        <Label className="text-sm font-medium">{hours.day}</Label>
                      </div>
                      <Switch
                        checked={hours.enabled}
                        onCheckedChange={(checked) => updateWorkingHours(hours.day, 'enabled', checked)}
                      />
                      {hours.enabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Start:</Label>
                            <Input
                              type="time"
                              value={hours.startTime}
                              onChange={(e) => updateWorkingHours(hours.day, 'startTime', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">End:</Label>
                            <Input
                              type="time"
                              value={hours.endTime}
                              onChange={(e) => updateWorkingHours(hours.day, 'endTime', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Free Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Free Hours
                  </CardTitle>
                  <CardDescription>
                    Set specific times when you're available for consultations or meetings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={addFreeHour} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Free Hour
                  </Button>

                  {profile.freeHours.map((hours) => (
                    <div key={hours.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Select value={hours.day} onValueChange={(value) => updateFreeHour(hours.id, 'day', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Start:</Label>
                        <Input
                          type="time"
                          value={hours.startTime}
                          onChange={(e) => updateFreeHour(hours.id, 'startTime', e.target.value)}
                          className="w-32"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-sm">End:</Label>
                        <Input
                          type="time"
                          value={hours.endTime}
                          onChange={(e) => updateFreeHour(hours.id, 'endTime', e.target.value)}
                          className="w-32"
                        />
                      </div>

                      <Input
                        value={hours.purpose}
                        onChange={(e) => updateFreeHour(hours.id, 'purpose', e.target.value)}
                        placeholder="Purpose (e.g., Consultation)"
                        className="flex-1"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFreeHour(hours.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={profile.emailNotifications}
                      onCheckedChange={(checked) => updateProfile('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={profile.smsNotifications}
                      onCheckedChange={(checked) => updateProfile('smsNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Session Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming sessions
                      </p>
                    </div>
                    <Switch
                      checked={profile.sessionReminders}
                      onCheckedChange={(checked) => updateProfile('sessionReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Progress Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates on learner progress
                      </p>
                    </div>
                    <Switch
                      checked={profile.progressUpdates}
                      onCheckedChange={(checked) => updateProfile('progressUpdates', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <Select value={profile.profileVisibility} onValueChange={(value: any) => updateProfile('profileVisibility', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Visible to all users</SelectItem>
                        <SelectItem value="therapists-only">Therapists Only - Visible to other therapists</SelectItem>
                        <SelectItem value="private">Private - Only visible to you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymized data sharing for research purposes
                      </p>
                    </div>
                    <Switch
                      checked={profile.dataSharing}
                      onCheckedChange={(checked) => updateProfile('dataSharing', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;