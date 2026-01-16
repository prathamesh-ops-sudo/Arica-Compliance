import { motion } from "framer-motion";
import { User, Bell, Palette, Shield, Mail, Globe, Moon, Sun, Check } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSettings, type ColorScheme, type DashboardLayout } from "@/hooks/useSettings";

export default function Settings() {
  const { 
    colorScheme, 
    dashboardLayout, 
    isDark, 
    setColorScheme, 
    setDashboardLayout, 
    toggleDarkMode 
  } = useSettings();

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    toast.success(`Color scheme changed to ${scheme}`);
  };

  const handleLayoutChange = (layout: string) => {
    setDashboardLayout(layout as DashboardLayout);
    toast.success(`Dashboard layout changed to ${layout}`);
  };

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your account and preferences
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="gap-2">
                    <Palette className="w-4 h-4" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Security
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
                          <AvatarFallback className="text-lg">JD</AvatarFallback>
                        </Avatar>
                        <div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.info("Photo upload coming soon!")}
                        >
                          Change Photo
                        </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            JPG, GIF or PNG. Max size 2MB
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue="Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="email" type="email" defaultValue="john@company.com" className="pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" defaultValue="Acme Corp" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="utc-8">
                          <SelectTrigger>
                            <Globe className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                            <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                            <SelectItem value="utc">UTC</SelectItem>
                            <SelectItem value="utc+1">Central European (UTC+1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSave} className="gradient-primary text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose how you want to be notified
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        { id: 'mentions', title: 'New Mentions', description: 'Get notified when your brand is mentioned', defaultChecked: true },
                        { id: 'alerts', title: 'Crisis Alerts', description: 'Immediate alerts for negative sentiment spikes', defaultChecked: true },
                        { id: 'reports', title: 'Weekly Reports', description: 'Receive weekly summary reports via email', defaultChecked: false },
                        { id: 'updates', title: 'Product Updates', description: 'News about new features and improvements', defaultChecked: true },
                        { id: 'tips', title: 'Tips & Best Practices', description: 'Helpful tips to improve your media intelligence', defaultChecked: false },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Switch defaultChecked={item.defaultChecked} />
                        </div>
                      ))}

                      <Button onClick={handleSave} className="gradient-primary text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Save Preferences
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance Settings</CardTitle>
                      <CardDescription>
                        Customize how AricaInsights looks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                          <div>
                            <p className="font-medium text-foreground">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                          </div>
                        </div>
                        <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
                      </div>

                      {/* Color Scheme Preview */}
                      <div className="space-y-3">
                        <Label>Color Scheme</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: 'Blue', colors: ['#0056D2', '#3B82F6', '#60A5FA'] },
                            { name: 'Green', colors: ['#059669', '#10B981', '#34D399'] },
                            { name: 'Purple', colors: ['#7C3AED', '#8B5CF6', '#A78BFA'] },
                          ].map((scheme) => (
                            <button
                              key={scheme.name}
                              type="button"
                              onClick={() => handleColorSchemeChange(scheme.name)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                colorScheme === scheme.name ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex gap-1 mb-2">
                                {scheme.colors.map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <p className="text-sm font-medium text-foreground">{scheme.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Dashboard Layout</Label>
                        <Select value={dashboardLayout} onValueChange={handleLayoutChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="expanded">Expanded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage your account security
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" placeholder="••••••••" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input id="newPassword" type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input id="confirmPassword" type="password" placeholder="••••••••" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-foreground">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.info("Two-Factor Authentication setup coming soon!")}
                        >
                          Enable
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-foreground">Active Sessions</p>
                          <p className="text-sm text-muted-foreground">Manage your active sessions</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.info("Session management coming soon!")}
                        >
                          View All
                        </Button>
                      </div>

                      <Button onClick={handleSave} className="gradient-primary text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Update Security
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
