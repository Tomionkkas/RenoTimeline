import React, { useState } from 'react';
import { Users, UserPlus, Mail, Phone, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useTeam, TeamMember } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
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
  online: 'bg-green-400',
  away: 'bg-yellow-400',
  offline: 'bg-gray-400',
};

const TeamOverview = () => {
  const { teamMembers, loading, error, deleteTeamMember } = useTeam();
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Błąd: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Zespół</h1>
          <p className="text-gray-400">Zarządzaj członkami Twojej organizacji.</p>
        </div>
        <AddTeamMemberDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamMembers.map((member: TeamMember, index: number) => (
          <div
            key={member.id}
            className="bg-card rounded-xl border border-gray-800 p-6 card-hover animate-fade-in flex flex-col justify-between"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{member.first_name?.charAt(0) || ''}</span>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{member.first_name}</h3>
                {member.expertise && <p className="text-blue-400 text-sm mb-3">{member.expertise}</p>}
                
                <div className="space-y-2 mb-4">
                  {member.email && (
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                  )}
                </div>
              </div>

               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Otwórz menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMemberToEdit(member)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edytuj
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => setMemberToDelete(member)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        ))}
      </div>
      
      {memberToEdit && (
        <EditTeamMemberDialog
          member={memberToEdit}
          open={!!memberToEdit}
          onOpenChange={(open) => !open && setMemberToEdit(null)}
        />
      )}

      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć członka zespołu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie profilu 
              użytkownika <span className="font-bold">{memberToDelete?.first_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
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
