import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Star } from 'lucide-react';
import { FeedbackSortBy, FeedbackCategory, FeedbackStatus } from '@/lib/types/feedback';

interface FeedbackFiltersProps {
  sortBy: FeedbackSortBy;
  onSortByChange: (sortBy: FeedbackSortBy) => void;
  category: FeedbackCategory;
  onCategoryChange: (category: FeedbackCategory) => void;
  status: FeedbackStatus;
  onStatusChange: (status: FeedbackStatus) => void;
}

export function FeedbackFilters({
  sortBy,
  onSortByChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
}: FeedbackFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Sort By Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant={sortBy === 'hot' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortByChange('hot')}
          className={sortBy === 'hot'
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'text-white/70 hover:text-white hover:bg-white/10'
          }
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Popularne
        </Button>
        <Button
          variant={sortBy === 'new' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortByChange('new')}
          className={sortBy === 'new'
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'text-white/70 hover:text-white hover:bg-white/10'
          }
        >
          <Clock className="w-4 h-4 mr-2" />
          Najnowsze
        </Button>
        <Button
          variant={sortBy === 'top' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortByChange('top')}
          className={sortBy === 'top'
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'text-white/70 hover:text-white hover:bg-white/10'
          }
        >
          <Star className="w-4 h-4 mr-2" />
          Najlepsze
        </Button>
      </div>

      {/* Category Filter */}
      <Select value={category} onValueChange={(value: FeedbackCategory) => onCategoryChange(value)}>
        <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-slate-800">
          <SelectItem value="all">Wszystkie kategorie</SelectItem>
          <SelectItem value="bug_report">Zgłoszenia błędów</SelectItem>
          <SelectItem value="feature_request">Prośby o funkcje</SelectItem>
          <SelectItem value="ui_ux_feedback">Opinie UI/UX</SelectItem>
          <SelectItem value="general_feedback">Opinie ogólne</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={status} onValueChange={(value: FeedbackStatus) => onStatusChange(value)}>
        <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-slate-800">
          <SelectItem value="all">Wszystkie statusy</SelectItem>
          <SelectItem value="open">Otwarte</SelectItem>
          <SelectItem value="in_progress">W trakcie</SelectItem>
          <SelectItem value="completed">Zakończone</SelectItem>
          <SelectItem value="closed">Zamknięte</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
