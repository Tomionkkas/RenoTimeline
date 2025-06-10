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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update the details of the team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">
                First Name
              </Label>
              <Input id="first_name" {...register('first_name')} className="col-span-3" />
              {errors.first_name && <p className="col-span-4 text-red-500 text-xs">{errors.first_name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">
                Last Name
              </Label>
              <Input id="last_name" {...register('last_name')} className="col-span-3" />
              {errors.last_name && <p className="col-span-4 text-red-500 text-xs">{errors.last_name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expertise" className="text-right">
                Expertise
              </Label>
              <Input id="expertise" {...register('expertise')} className="col-span-3" />
              {errors.expertise && <p className="col-span-4 text-red-500 text-xs">{errors.expertise.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email (Optional)
              </Label>
              <Input id="email" {...register('email')} className="col-span-3" />
              {errors.email && <p className="col-span-4 text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 