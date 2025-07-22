import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavingsPlan {
  id: string;
  type: string;
  amount: number;
  frequency: string;
  next_run?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const SavingsPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SavingsPlan | null>(null);
  const [form, setForm] = useState({ type: 'fixed', amount: '', frequency: 'weekly', next_run: '', active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/functions/v1/savings-plans?user_id=${user.id}`);
      const json = await res.json();
      setPlans(json.plans || []);
    } catch (e) {
      toast({ title: 'Failed to fetch savings plans', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: SavingsPlan) => {
    setEditingPlan(plan || null);
    setForm(plan ? {
      type: plan.type,
      amount: plan.amount.toString(),
      frequency: plan.frequency,
      next_run: plan.next_run ? plan.next_run.slice(0, 10) : '',
      active: plan.active
    } : { type: 'fixed', amount: '', frequency: 'weekly', next_run: '', active: true });
    setShowDialog(true);
  };

  const handleSavePlan = async () => {
    if (!user) return;
    if (!form.type || !form.amount || !form.frequency) {
      toast({ title: 'Type, amount, and frequency are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const method = editingPlan ? 'PATCH' : 'POST';
      const body = editingPlan
        ? { id: editingPlan.id, ...form, amount: parseFloat(form.amount) }
        : { ...form, amount: parseFloat(form.amount) };
      const res = await fetch(`/functions/v1/savings-plans?user_id=${user.id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: editingPlan ? 'Plan updated' : 'Plan created' });
      setShowDialog(false);
      fetchPlans();
    } catch (e: any) {
      toast({ title: e.message || 'Failed to save plan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (plan: SavingsPlan) => {
    if (!user) return;
    if (!window.confirm('Delete this plan?')) return;
    try {
      const res = await fetch(`/functions/v1/savings-plans?user_id=${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: 'Plan deleted' });
      fetchPlans();
    } catch (e: any) {
      toast({ title: e.message || 'Failed to delete plan', variant: 'destructive' });
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
            <h1 className="text-3xl font-bold text-gray-900">Automated Savings Plans</h1>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" /> New Plan
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No savings plans yet. Create your first plan!</div>
        ) : (
          <div className="grid gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className="relative">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                    <span className={`text-xs px-2 py-0.5 rounded ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{plan.active ? 'Active' : 'Inactive'}</span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(plan)} aria-label="Edit plan"><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeletePlan(plan)} aria-label="Delete plan"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-semibold">₦{plan.amount.toLocaleString()} / {plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1)}</div>
                      {plan.next_run && <div className="text-xs text-gray-500">Next run: {plan.next_run.slice(0, 10)}</div>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Created: {plan.created_at.slice(0, 10)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'New Savings Plan'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-type">Plan Type</Label>
                <Input
                  id="plan-type"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  placeholder="e.g. fixed"
                  disabled
                />
                <span className="text-xs text-gray-500">(Only 'fixed' supported for now)</span>
              </div>
              <div>
                <Label htmlFor="plan-amount">Amount (₦)</Label>
                <Input
                  id="plan-amount"
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="plan-frequency">Frequency</Label>
                <select
                  id="plan-frequency"
                  className="w-full border rounded px-3 py-2"
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                >
                  {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="plan-next-run">Start Date</Label>
                <Input
                  id="plan-next-run"
                  type="date"
                  value={form.next_run}
                  onChange={e => setForm(f => ({ ...f, next_run: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSavePlan} disabled={saving}>{saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SavingsPlans; 