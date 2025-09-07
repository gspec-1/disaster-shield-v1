import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Shield,
  ChevronLeft,
  Link as LinkIcon,
  Key,
  Settings
} from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

interface InsuranceCompany {
  id: string
  name: string
  display_name: string
  api_endpoint?: string
  api_key_encrypted?: string
  api_headers: any
  supported_perils: string[]
  is_active: boolean
  requires_manual_submission: boolean
  created_at: string
  updated_at: string
}

const PERIL_OPTIONS = [
  { value: 'water', label: 'Water Damage' },
  { value: 'flood', label: 'Flood' },
  { value: 'wind', label: 'Wind/Storm' },
  { value: 'fire', label: 'Fire' },
  { value: 'mold', label: 'Mold' },
  { value: 'other', label: 'Other' }
]

export default function InsuranceCompaniesPage() {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    api_endpoint: '',
    api_key: '',
    api_headers: '{}',
    supported_perils: [] as string[],
    is_active: true,
    requires_manual_submission: true
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('display_name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load insurance companies')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      display_name: company.display_name,
      api_endpoint: company.api_endpoint || '',
      api_key: company.api_key_encrypted ? '***ENCRYPTED***' : '',
      api_headers: JSON.stringify(company.api_headers, null, 2),
      supported_perils: company.supported_perils,
      is_active: company.is_active,
      requires_manual_submission: company.requires_manual_submission
    })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingCompany(null)
    setFormData({
      name: '',
      display_name: '',
      api_endpoint: '',
      api_key: '',
      api_headers: '{}',
      supported_perils: [],
      is_active: true,
      requires_manual_submission: true
    })
    setIsCreating(true)
  }

  const handleCancel = () => {
    setEditingCompany(null)
    setIsCreating(false)
    setFormData({
      name: '',
      display_name: '',
      api_endpoint: '',
      api_key: '',
      api_headers: '{}',
      supported_perils: [],
      is_active: true,
      requires_manual_submission: true
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.display_name) {
      toast.error('Name and display name are required')
      return
    }

    setSaving(true)
    try {
      let apiHeaders = {}
      try {
        apiHeaders = JSON.parse(formData.api_headers)
      } catch (e) {
        toast.error('Invalid JSON in API headers')
        return
      }

      const companyData = {
        name: formData.name,
        display_name: formData.display_name,
        api_endpoint: formData.api_endpoint || null,
        api_headers: apiHeaders,
        supported_perils: formData.supported_perils,
        is_active: formData.is_active,
        requires_manual_submission: formData.requires_manual_submission
      }

      if (isCreating) {
        const { error } = await supabase
          .from('insurance_companies')
          .insert(companyData)

        if (error) throw error
        toast.success('Insurance company created successfully')
      } else if (editingCompany) {
        const { error } = await supabase
          .from('insurance_companies')
          .update(companyData)
          .eq('id', editingCompany.id)

        if (error) throw error
        toast.success('Insurance company updated successfully')
      }

      await loadCompanies()
      handleCancel()
    } catch (error) {
      console.error('Error saving company:', error)
      toast.error('Failed to save insurance company')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (company: InsuranceCompany) => {
    if (!confirm(`Are you sure you want to delete ${company.display_name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', company.id)

      if (error) throw error
      toast.success('Insurance company deleted successfully')
      await loadCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('Failed to delete insurance company')
    }
  }

  const togglePeril = (peril: string) => {
    setFormData(prev => ({
      ...prev,
      supported_perils: prev.supported_perils.includes(peril)
        ? prev.supported_perils.filter(p => p !== peril)
        : [...prev.supported_perils, peril]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading insurance companies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Admin</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              Insurance Companies
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Insurance Companies
              </h1>
              <p className="text-gray-600">
                Manage insurance company integrations and API connections
              </p>
            </div>
            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Companies List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Insurance Companies ({companies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div key={company.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{company.display_name}</h3>
                            <Badge variant={company.is_active ? "default" : "secondary"}>
                              {company.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {!company.requires_manual_submission && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                API
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Internal Name: {company.name}
                          </p>
                          {company.api_endpoint && (
                            <p className="text-sm text-gray-600 mb-2">
                              API Endpoint: {company.api_endpoint}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {company.supported_perils.map((peril) => (
                              <Badge key={peril} variant="outline" className="text-xs">
                                {PERIL_OPTIONS.find(p => p.value === peril)?.label || peril}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(company.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(company)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-1">
            {(editingCompany || isCreating) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {isCreating ? 'Add New Company' : 'Edit Company'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Internal Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., liberty_mutual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name *</label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="e.g., Liberty Mutual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Endpoint</label>
                    <Input
                      value={formData.api_endpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                      placeholder="https://api.example.com/fnol"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Enter API key"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Headers (JSON)</label>
                    <Textarea
                      value={formData.api_headers}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_headers: e.target.value }))}
                      placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Supported Perils</label>
                    <div className="space-y-2">
                      {PERIL_OPTIONS.map((peril) => (
                        <div key={peril.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={peril.value}
                            checked={formData.supported_perils.includes(peril.value)}
                            onCheckedChange={() => togglePeril(peril.value)}
                          />
                          <label htmlFor={peril.value} className="text-sm">
                            {peril.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                      />
                      <label htmlFor="is_active" className="text-sm font-medium">
                        Active
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requires_manual"
                        checked={formData.requires_manual_submission}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_manual_submission: !!checked }))}
                      />
                      <label htmlFor="requires_manual" className="text-sm font-medium">
                        Requires Manual Submission
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
