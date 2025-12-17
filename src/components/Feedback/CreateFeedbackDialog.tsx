import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeedbackPosts } from '@/hooks/useFeedbackPosts';

interface CreateFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFeedbackDialog({ open, onOpenChange }: CreateFeedbackDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'bug_report' | 'feature_request' | 'ui_ux_feedback' | 'general_feedback'>('general_feedback');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { createPost } = useFeedbackPosts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    createPost({
      title: title.trim(),
      content: content.trim(),
      category,
      is_anonymous: isAnonymous,
      status: 'open',
    });

    // Reset form
    setTitle('');
    setContent('');
    setCategory('general_feedback');
    setIsAnonymous(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Podziel się opinią</DialogTitle>
          <DialogDescription className="text-white/60">
            Twoja opinia pomaga nam ulepszyć RenoTimeline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Tytuł</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Krótki opis Twojej opinii..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">Kategoria</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                <SelectItem value="bug_report">Zgłoszenie błędu</SelectItem>
                <SelectItem value="feature_request">Prośba o funkcję</SelectItem>
                <SelectItem value="ui_ux_feedback">Opinia UI/UX</SelectItem>
                <SelectItem value="general_feedback">Opinia ogólna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Szczegóły</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Opisz szczegółowo swoją opinię..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
              required
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="anonymous" className="text-white">Publikuj anonimowo</Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              disabled={!title.trim() || !content.trim()}
            >
              Opublikuj
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
