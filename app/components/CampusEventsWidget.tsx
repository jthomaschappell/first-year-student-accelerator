import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { campusEventsData } from '@/app/data/mockCampusEvents';

export function CampusEventsWidget() {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'career': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'academic': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'social': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'wellness': return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      case 'sports': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date(2025, 0, 20); // Mock current date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (time === '00:00') return 'All Day';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const sortedEvents = [...campusEventsData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="p-4 h-full flex flex-col bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl">
      <h4 className="mb-4 text-white">Campus Events</h4>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {sortedEvents.map(event => (
            <Card key={event.id} className="p-3 bg-slate-800/80 hover:bg-slate-800 backdrop-blur-sm transition-all cursor-pointer border-slate-700/50 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm flex-1 text-slate-100">{event.title}</h4>
                <Badge className={getCategoryColor(event.category)}>
                  {event.category}
                </Badge>
              </div>
              
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {event.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
