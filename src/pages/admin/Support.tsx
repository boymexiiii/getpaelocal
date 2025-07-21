import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  created_at: string;
}

const SupportAdminPage = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/functions/v1/admin-support');
      if (!res.ok) throw new Error('Failed to fetch support tickets');
      const data = await res.json();
      setTickets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line
  }, []);

  const handleResolve = async (ticket: SupportTicket) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/functions/v1/admin-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticket.id }),
      });
      if (!res.ok) throw new Error('Failed to resolve ticket');
      await res.json();
      fetchTickets();
      toast({ title: 'Resolved', description: 'Ticket marked as resolved.' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.message.toLowerCase().includes(search.toLowerCase()) ||
    t.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Management</CardTitle>
        <Input
          placeholder="Search by subject, message, or user ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mt-2 max-w-xs"
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.user_id}</TableCell>
                  <TableCell>{ticket.status}</TableCell>
                  <TableCell>{new Date(ticket.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {ticket.status === 'open' && (
                      <Button size="sm" onClick={() => handleResolve(ticket)} disabled={actionLoading}>Mark Resolved</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportAdminPage;
