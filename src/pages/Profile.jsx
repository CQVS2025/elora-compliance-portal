import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Calendar, Shield } from 'lucide-react';

export default function Profile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#7CB342] animate-spin" />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
          <p className="text-slate-600 mt-2">View and manage your account information</p>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback
                  className="text-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)' }}
                >
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800">{user?.name || 'Unknown User'}</h2>
                <p className="text-slate-600 mt-1">{user?.email}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                  {user?.role && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Details
            </CardTitle>
            <CardDescription>Your personal information and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <p className="text-sm font-medium">Email Address</p>
                </div>
                <p className="text-slate-800 pl-6">{user?.email || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4" />
                  <p className="text-sm font-medium">User ID</p>
                </div>
                <p className="text-slate-800 pl-6 font-mono text-sm">{user?.id || 'N/A'}</p>
              </div>

              {user?.created_at && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm font-medium">Member Since</p>
                  </div>
                  <p className="text-slate-800 pl-6">{formatDate(user.created_at)}</p>
                </div>
              )}

              {user?.role && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Shield className="w-4 h-4" />
                    <p className="text-sm font-medium">Role</p>
                  </div>
                  <p className="text-slate-800 pl-6">{user.role}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        {user?.metadata && Object.keys(user.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Extra details about your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(user.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium text-slate-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-slate-800">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
