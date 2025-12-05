import React, { useState } from 'react';
import { Users, UserPlus, Mail, Phone, MoreVertical, Trash2, Edit, User } from 'lucide-react';
import { useTeam, TeamMember } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'react-hot-toast';

const statusColors = {
  online: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  away: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  offline: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const TeamOverview = () => {
  const { teamMembers, loading, error, deleteTeamMember } = useTeam();
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400">Błąd podczas ładowania zespołu: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Zespół</h2>
          <p className="text-white/60 text-lg">Zarządzaj członkami Twojej organizacji.</p>
        </div>
        <AddTeamMemberDialog />
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Wszyscy członkowie</p>
                <p className="text-2xl font-bold text-white">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Aktywni</p>
                <p className="text-2xl font-bold text-white">
                  {teamMembers.filter(m => m.status === 'online').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <UserPlus className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Nowi w tym miesiącu</p>
                <p className="text-2xl font-bold text-white">
                  {teamMembers.filter(m => {
                    const memberDate = new Date(m.created_at);
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return memberDate > monthAgo;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamMembers.map((member: TeamMember, index: number) => (
          <Card
            key={member.id}
            className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-lg">
                      {member.first_name?.charAt(0) || member.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColors[member.status || 'offline']}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.first_name || member.last_name || 'Nieznany użytkownik'}
                    </h3>
                    <Badge className={statusColors[member.status || 'offline']}>
                      {member.status === 'online' ? 'Online' : member.status === 'away' ? 'Niedostępny' : 'Offline'}
                    </Badge>
                  </div>
                  
                  {member.expertise && (
                    <p className="text-blue-400 text-sm mb-3 font-medium">{member.expertise}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    {member.email && (
                      <div className="flex items-center space-x-2 text-white/60 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center space-x-2 text-white/60 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg"
                    >
                      <span className="sr-only">Otwórz menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                    <DropdownMenuItem 
                      onClick={() => setMemberToEdit(member)}
                      className="text-white/80 hover:text-white hover:bg-white/20"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={() => setMemberToDelete(member)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 && (
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-semibold text-white mb-2">Brak członków zespołu</h3>
            <p className="text-white/60 mb-6">Dodaj pierwszego członka zespołu, aby rozpocząć współpracę</p>
            <AddTeamMemberDialog />
          </CardContent>
        </Card>
      )}
      
      {memberToEdit && (
        <EditTeamMemberDialog
          member={memberToEdit}
          open={!!memberToEdit}
          onOpenChange={(open) => !open && setMemberToEdit(null)}
        />
      )}

      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Czy na pewno chcesz usunąć członka zespołu?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie profilu
              użytkownika <span className="font-bold text-white">
                {memberToDelete?.first_name && memberToDelete?.last_name
                  ? `${memberToDelete.first_name} ${memberToDelete.last_name}`
                  : memberToDelete?.first_name || memberToDelete?.last_name}
              </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (memberToDelete) {
                  try {
                    await deleteTeamMember(memberToDelete.id);
                    toast.success('Członek zespołu został usunięty.');
                    setMemberToDelete(null);
                  } catch (err) {
                     toast.error('Nie udało się usunąć członka zespołu.');
                  }
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamOverview;
