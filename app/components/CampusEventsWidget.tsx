import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BYUEvent {
  EventId: string;
  Title: string;
  StartDateTime: string;
  EndDateTime: string;
  LocationName: string;
  Description: string;
  CategoryName: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  description: string;
  tags: string[];
}

export function CampusEventsWidget() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const mapCategory = (categoryName: string): string => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('career') || lower.includes('job') || lower.includes('employment')) return 'career';
    if (lower.includes('academic') || lower.includes('education') || lower.includes('study')) return 'academic';
    if (lower.includes('social') || lower.includes('community') || lower.includes('networking')) return 'social';
    if (lower.includes('wellness') || lower.includes('health') || lower.includes('mental')) return 'wellness';
    if (lower.includes('sport') || lower.includes('athletic') || lower.includes('fitness')) return 'sports';
    return 'other';
  };

  const mapBYUEventToEvent = (byuEvent: BYUEvent): Event => {
    const startDateTime = new Date(byuEvent.StartDateTime);
    const dateStr = startDateTime.toISOString().split('T')[0];
    
    // Extract time from StartDateTime (format: MM-dd-yyyy HH:mm:ss)
    const startTime = startDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    // Extract time from EndDateTime
    const endDateTime = new Date(byuEvent.EndDateTime);
    const endTime = endDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    return {
      id: byuEvent.EventId,
      title: byuEvent.Title,
      date: dateStr,
      startTime: startTime,
      endTime: endTime,
      location: byuEvent.LocationName || 'TBA',
      category: mapCategory(byuEvent.CategoryName),
      description: byuEvent.Description || '',
      tags: [byuEvent.CategoryName.toLowerCase()]
    };
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const today = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(today.getDate() + 14);
        
        const startDate = today.toISOString().split('T')[0];
        const endDate = twoWeeksFromNow.toISOString().split('T')[0];
        
        const url = new URL('https://calendar.byu.edu/api/Events.json');
        url.searchParams.set('categories', 'all');
        url.searchParams.set('event[min][date]', startDate);
        url.searchParams.set('event[max][date]', endDate);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('BYU API Response:', data);
        
        // Handle BYU API response structure - it returns {result: {item: [...]}}
        let eventsArray = [];
        if (data.result && data.result.item) {
          // Handle single item vs array of items
          eventsArray = Array.isArray(data.result.item) ? data.result.item : [data.result.item];
        } else if (Array.isArray(data)) {
          eventsArray = data;
        } else if (data.events) {
          eventsArray = data.events;
        }
        
        const mappedEvents = eventsArray.map(mapBYUEventToEvent);
        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching campus events:', err);
        setError('Failed to load campus events');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
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

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="p-4 h-full flex flex-col bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl">
      <h4 className="mb-4 text-white">Campus Events</h4>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {isLoading ? (
            <div className="text-center text-slate-400 py-8">
              <div className="animate-pulse">Loading campus events...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              <div>{error}</div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <div>No upcoming events found</div>
            </div>
          ) : (
            sortedEvents.map(event => (
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
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
