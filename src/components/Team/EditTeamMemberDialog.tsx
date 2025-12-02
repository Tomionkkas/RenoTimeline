import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTeam, TeamMember } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { User, Mail, Briefcase, Edit3 } from 'lucide-react';

const editMemberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  expertise: z.string().optional(),
});

type EditMemberSchema = z.infer<typeof editMemberSchema>;

interface EditTeamMemberDialogProps {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamMemberDialog({ member, open, onOpenChange }: EditTeamMemberDialogProps) {
  const { updateTeamMember, isUpdating } = useTeam();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditMemberSchema>({
    resolver: zodResolver(editMemberSchema),
  });

  useEffect(() => {
    if (member) {
      reset({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        expertise: member.expertise || '',
      });
    }
  }, [member, reset]);

  const onSubmit = async (data: EditMemberSchema) => {
    try {
      const updatedMember = {
        ...member,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        expertise: data.expertise || null,
      };
      await updateTeamMember(updatedMember);
      toast.success('Team member updated successfully!');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Edit3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Edit Team Member</DialogTitle>
              <DialogDescription className="text-white/60 text-base">
                Update the details of the team member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* First Name */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-400" />
              <Label htmlFor="first_name" className="text-white font-medium">
                First Name
              </Label>
            </div>
            <Input 
              id="first_name" 
              {...register('first_name')} 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
            />
            {errors.first_name && (
              <p className="text-red-400 text-xs flex items-center space-x-1">
                <span>⚠</span>
                <span>{errors.first_name.message}</span>
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-400" />
              <Label htmlFor="last_name" className="text-white font-medium">
                Last Name
              </Label>
            </div>
            <Input 
              id="last_name" 
              {...register('last_name')} 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
            />
            {errors.last_name && (
              <p className="text-red-400 text-xs flex items-center space-x-1">
                <span>⚠</span>
                <span>{errors.last_name.message}</span>
              </p>
            )}
          </div>

          {/* Expertise */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <Label htmlFor="expertise" className="text-white font-medium">
                Expertise
              </Label>
            </div>
            <Input 
              id="expertise" 
              {...register('expertise')} 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
            />
            {errors.expertise && (
              <p className="text-red-400 text-xs flex items-center space-x-1">
                <span>⚠</span>
                <span>{errors.expertise.message}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <Label htmlFor="email" className="text-white font-medium">
                Email (Optional)
              </Label>
            </div>
            <Input 
              id="email" 
              {...register('email')} 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
            />
            {errors.email && (
              <p className="text-red-400 text-xs flex items-center space-x-1">
                <span>⚠</span>
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-white/10">
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 w-full"
            >
              {isUpdating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 