
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Landmark, Phone, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NigeriaBankTransfer from "@/components/NigeriaBankTransfer";
import NigerianSupport from "@/components/NigerianSupport";
import CBNCompliance from "@/components/CBNCompliance";
import Layout from "@/components/Layout";

const NigeriaBanking = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transfer');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mr-4 text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nigerian Banking Services
          </h1>
          <p className="text-lg text-gray-600">
            Send money, get support, and stay compliant with CBN regulations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="transfer" className="flex items-center space-x-2">
              <Landmark className="w-4 h-4" />
              <span>Bank Transfer</span>
            </TabsTrigger>
            <TabsTrigger value="ussd" className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>USSD Banking</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Nigerian Support</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>CBN Compliance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="space-y-6">
            <NigeriaBankTransfer />
          </TabsContent>

          <TabsContent value="ussd" className="space-y-6">
            <NigeriaBankTransfer />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <NigerianSupport />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <CBNCompliance />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default NigeriaBanking;
