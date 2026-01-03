'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldCheck, ShieldOff, Copy, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { twoFactorApi } from '@/lib/api';

interface TwoFactorSetupProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function TwoFactorSetup({ onClose, onSuccess }: TwoFactorSetupProps) {
  const [status, setStatus] = useState<{ enabled: boolean; backup_codes_remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Setup state
  const [setupData, setSetupData] = useState<{
    secret: string;
    qr_code: string;
    backup_codes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup' | 'disable'>('status');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await twoFactorApi.getStatus();
      setStatus(data);
      setStep('status');
    } catch (err: any) {
      console.error('Error loading 2FA status:', err);
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await twoFactorApi.setup();
      setSetupData(data);
      setStep('setup');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await twoFactorApi.verifyAndEnable(verificationCode);
      setSuccess('2FA has been successfully enabled!');
      setStep('backup');
      await loadStatus();
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Please enter your current 2FA code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await twoFactorApi.disable(disableCode);
      setSuccess('2FA has been disabled');
      setDisableCode('');
      await loadStatus();
      setStep('status');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter your current 2FA code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await twoFactorApi.regenerateBackupCodes(verificationCode);
      setSetupData(prev => prev ? { ...prev, backup_codes: data.backup_codes } : null);
      setShowBackupCodes(true);
      setSuccess('New backup codes generated');
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backup_codes) {
      navigator.clipboard.writeText(setupData.backup_codes.join('\n'));
      setSuccess('Backup codes copied to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    if (setupData?.backup_codes) {
      const content = `Galaxy Audit System - 2FA Backup Codes\n\nKeep these codes safe. Each code can only be used once.\n\n${setupData.backup_codes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'galaxy-audit-2fa-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !setupData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Status View */}
        {step === 'status' && status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {status.enabled ? (
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                ) : (
                  <ShieldOff className="h-8 w-8 text-gray-400" />
                )}
                <div>
                  <p className="font-medium">
                    {status.enabled ? '2FA is enabled' : '2FA is not enabled'}
                  </p>
                  {status.enabled && (
                    <p className="text-sm text-gray-600">
                      {status.backup_codes_remaining} backup codes remaining
                    </p>
                  )}
                </div>
              </div>
              <Badge className={status.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {status.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {!status.enabled ? (
              <Button onClick={handleSetup} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            ) : (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('disable')}
                  className="w-full"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
                {status.backup_codes_remaining < 5 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      You have only {status.backup_codes_remaining} backup codes left. Consider regenerating them.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* Setup View */}
        {step === 'setup' && setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center mb-4">
                <img 
                  src={setupData.qr_code} 
                  alt="2FA QR Code" 
                  className="border rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500">
                Or enter this code manually: <code className="bg-gray-100 px-2 py-1 rounded">{setupData.secret}</code>
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Enter verification code from your app
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
              <Button 
                onClick={handleVerify} 
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes View */}
        {step === 'backup' && setupData?.backup_codes && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-medium">2FA Enabled Successfully!</h3>
              <p className="text-sm text-gray-600">
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                {setupData.backup_codes.map((code, index) => (
                  <code key={index} className="bg-white px-3 py-2 rounded border text-center font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Each backup code can only be used once. Store them securely and don't share them with anyone.
              </AlertDescription>
            </Alert>

            <Button onClick={() => { setStep('status'); loadStatus(); }} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* Disable View */}
        {step === 'disable' && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Disabling 2FA will make your account less secure. Are you sure you want to continue?
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Enter your current 2FA code to confirm
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setStep('status'); setDisableCode(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDisable} 
                  disabled={loading || disableCode.length !== 6}
                  className="flex-1"
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full mt-4">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
