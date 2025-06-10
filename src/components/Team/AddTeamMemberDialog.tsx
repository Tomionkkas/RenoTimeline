import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTeam } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const addMemberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  expertise: z.string().optional(),
});

type AddMemberSchema = z.infer<typeof addMemberSchema>;

export function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false);
  const { addTeamMember, isAdding } = useTeam();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddMemberSchema>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      expertise: '',
    },
  });

  const onSubmit = async (data: AddMemberSchema) => {
    try {
      const newMember = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        expertise: data.expertise || null,
      };
      await addTeamMember(newMember);
      toast.success('Team member added successfully!');
      reset();
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Enter the details of the new team member.
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
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 