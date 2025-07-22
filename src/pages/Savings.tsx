import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Plus, Trash2, Edit, ArrowLeft, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  status: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

const Savings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [fundDialog, setFundDialog] = useState<{ type: 'add' | 'withdraw'; goal: SavingsGoal | null }>({ type: 'add', goal: null });
  const [fundAmount, setFundAmount] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/functions/v1/savings-goals?user_id=${user.id}`);
      const json = await res.json();
      setGoals(json.goals || []);
    } catch (e) {
      toast({ title: 'Failed to fetch savings goals', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (goal?: SavingsGoal) => {
    setEditingGoal(goal || null);
    setForm(goal ? {
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      deadline: goal.deadline || ''
    } : { name: '', target_amount: '', deadline: '' });
    setShowDialog(true);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    if (!form.name || !form.target_amount) {
      toast({ title: 'Name and target amount are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const method = editingGoal ? 'PATCH' : 'POST';
      const body = editingGoal
        ? { id: editingGoal.id, ...form, target_amount: parseFloat(form.target_amount) }
        : { ...form, target_amount: parseFloat(form.target_amount) };
      const res = await fetch(`/functions/v1/savings-goals?user_id=${user.id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: editingGoal ? 'Goal updated' : 'Goal created' });
      setShowDialog(false);
      fetchGoals();
    } catch (e: any) {
      toast({ title: e.message || 'Failed to save goal', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    if (!user) return;
    if (!window.confirm('Delete this goal?')) return;
    try {
      const res = await fetch(`/functions/v1/savings-goals?user_id=${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: goal.id })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: 'Goal deleted' });
      fetchGoals();
    } catch (e: any) {
      toast({ title: e.message || 'Failed to delete goal', variant: 'destructive' });
    }
  };

  const handleFundAction = (type: 'add' | 'withdraw', goal: SavingsGoal) => {
    setFundDialog({ type, goal });
    setFundAmount('');
  };

  const handleFundSubmit = async () => {
    if (!user || !fundDialog.goal) return;
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setFundLoading(true);
    try {
      const endpoint = fundDialog.type === 'add' ? 'add-funds' : 'withdraw-funds';
      const res = await fetch(`/functions/v1/savings-goals/${endpoint}?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: fundDialog.goal.id, amount: parseFloat(fundAmount) })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: fundDialog.type === 'add' ? 'Funds added' : 'Funds withdrawn' });
      setFundDialog({ type: 'add', goal: null });
      fetchGoals();
    } catch (e: any) {
      toast({ title: e.message || 'Failed to update goal', variant: 'destructive' });
    } finally {
      setFundLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" /> New Goal
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No savings goals yet. Create your first goal!</div>
        ) : (
          <div className="grid gap-6">
            {goals.map(goal => {
              const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              return (
                <Card key={goal.id} className="relative">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {goal.name}
                      <span className={`text-xs px-2 py-0.5 rounded ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}</span>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(goal)} aria-label="Edit goal"><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteGoal(goal)} aria-label="Delete goal"><Trash2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleFundAction('add', goal)} aria-label="Add funds"><ArrowDownCircle className="w-4 h-4 text-green-600" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleFundAction('withdraw', goal)} aria-label="Withdraw funds"><ArrowUpCircle className="w-4 h-4 text-red-600" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-lg font-semibold">₦{goal.current_amount.toLocaleString()} / ₦{goal.target_amount.toLocaleString()}</div>
                        {goal.deadline && <div className="text-xs text-gray-500">Deadline: {goal.deadline}</div>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Created: {goal.created_at.slice(0, 10)}</span>
                      </div>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. New Phone"
                />
              </div>
              <div>
                <Label htmlFor="goal-amount">Target Amount (₦)</Label>
                <Input
                  id="goal-amount"
                  type="number"
                  value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                  placeholder="e.g. 100000"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="goal-deadline">Deadline (optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveGoal} disabled={saving}>{saving ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Create Goal')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!fundDialog.goal} onOpenChange={open => { if (!open) setFundDialog({ type: 'add', goal: null }); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{fundDialog.type === 'add' ? 'Add Funds to Goal' : 'Withdraw from Goal'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fund-amount">Amount (₦)</Label>
                <Input
                  id="fund-amount"
                  type="number"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  min="1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setFundDialog({ type: 'add', goal: null })} disabled={fundLoading}>Cancel</Button>
                <Button onClick={handleFundSubmit} disabled={fundLoading}>{fundLoading ? (fundDialog.type === 'add' ? 'Adding...' : 'Withdrawing...') : (fundDialog.type === 'add' ? 'Add Funds' : 'Withdraw')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Savings; 