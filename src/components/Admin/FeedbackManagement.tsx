import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Feedback {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string;
  };
}

function FeedbackManagement() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('feedback')
        .select('*, profiles!inner(email, full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback((data as any) || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to fetch feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', feedbackId);

      if (error) throw error;

      setFeedback(feedback.map(item => 
        item.id === feedbackId ? { ...item, status } : item
      ));

      toast({
        title: "Success",
        description: "Feedback status updated",
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'outline',
      closed: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.profiles?.full_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{item.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.subject}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(item.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFeedback(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Feedback Details</DialogTitle>
                            </DialogHeader>
                            {selectedFeedback && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">From:</label>
                                  <p className="text-sm">{selectedFeedback.profiles?.full_name} ({selectedFeedback.profiles?.email})</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Subject:</label>
                                  <p className="text-sm">{selectedFeedback.subject}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Message:</label>
                                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                                    {selectedFeedback.message}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status:</label>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Select
                                      value={selectedFeedback.status}
                                      onValueChange={(value) => {
                                        updateFeedbackStatus(selectedFeedback.id, value);
                                        setSelectedFeedback({...selectedFeedback, status: value});
                                      }}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FeedbackManagement;