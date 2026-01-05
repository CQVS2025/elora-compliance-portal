import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Palette,
  Globe,
  Lock,
  ChevronRight,
  User,
  Shield
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

  const settingsSections = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'View and manage your profile information',
      onClick: () => navigate('/Profile'),
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences and alerts',
      onClick: () => navigate('/NotificationSettings'),
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      onClick: () => {},
      color: 'bg-green-50 text-green-600',
      disabled: true
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel of the portal',
      onClick: () => {},
      color: 'bg-pink-50 text-pink-600',
      disabled: true
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your preferred language and regional settings',
      onClick: () => {},
      color: 'bg-orange-50 text-orange-600',
      disabled: true
    },
    {
      icon: Lock,
      title: 'Access & Permissions',
      description: 'Manage your access rights and permissions',
      onClick: () => {},
      color: 'bg-red-50 text-red-600',
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid gap-4">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card
                key={index}
                className={`transition-all duration-200 ${
                  section.disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-md cursor-pointer'
                }`}
                onClick={section.disabled ? undefined : section.onClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          {section.title}
                          {section.disabled && (
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                              Coming Soon
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                      </div>
                    </div>
                    {!section.disabled && (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Card */}
        <Card className="bg-gradient-to-br from-[#7CB342] to-[#689F38] text-white">
          <CardHeader>
            <CardTitle className="text-white">Need Help?</CardTitle>
            <CardDescription className="text-white/90">
              If you're having trouble with any settings, our support team is here to help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              className="bg-white text-[#7CB342] hover:bg-slate-50"
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
