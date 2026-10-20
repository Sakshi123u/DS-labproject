import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  ArrowRight,
  Layers,
  Cpu,
} from 'lucide-react';
import { SystemHealthResponse } from '../types';

interface SystemStatusPageProps {
  health: SystemHealthResponse | null;
  loading: boolean;
  onRefreshHealth: () => Promise<void>;
}

export const SystemStatusPage: React.FC<SystemStatusPageProps> = ({
  health,
  loading,
  onRefreshHealth,
}) => {
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async () => {
    try {
      setIsPinging(true);
      await onRefreshHealth();
    } finally {
      setIsPinging(false);
    }
  };

  const servicesInfo = [
    {
      id: 'api-gateway',
      name: 'API Gateway',
      port: 8080,
      protocol: 'REST / HTTP',
      role: 'Single ingress router; dispatches requests to backend microservices and aggregates health checks.',
    },
    {
      id: 'book-service',
      name: 'Book Service',
      port: 4001,
      protocol: 'REST / Express',
      role: 'Catalog CRUD, search indexing, and atomic inventory mutations ($inc: -1 / +1).',
    },
    {
      id: 'borrow-service',
      name: 'Borrow Service',
      port: 4002,
      protocol: 'REST / Express',
      role: 'Manages loan state, verifies stock with Book Service, prevents duplicates, triggers notifications.',
    },
    {
      id: 'notification-service',
      name: 'Notification Service',
      port: 4003,
      protocol: 'REST / Express',
      role: 'Asynchronous event stream; stores and broadcasts borrowing and return events.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Health Summary Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              health?.overallStatus === 'HEALTHY'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Distributed Cluster Health:{' '}
                <span
                  className={
                    health?.overallStatus === 'HEALTHY'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }
                >
                  {health?.overallStatus || 'CHECKING...'}
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live probes evaluated concurrently across all four microservices
            </p>
          </div>
        </div>

        <button
          onClick={handlePing}
          disabled={isPinging || loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging || loading ? 'animate-spin' : ''}`} />
          <span>Ping All Endpoints</span>
        </button>
      </div>

      {/* 4 Microservice Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {servicesInfo.map(service => {
          const liveCheck = health?.services.find(s => s.id === service.id);
          const isUp = liveCheck?.status === 'UP';

          return (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-600" />
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      Port {service.port}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {isUp ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>HEALTHY</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>OFFLINE</span>
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {service.role}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] text-slate-400">Endpoint: /health</span>
                <span className="font-mono tabular-nums text-slate-900 font-medium">
                  {liveCheck && liveCheck.latencyMs >= 0 ? `${liveCheck.latencyMs}ms` : '--'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Architecture Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-800" />
            <h3 className="text-base font-bold text-slate-900">
              Microservice Architecture & Communication Topology
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates inter-service REST communication, decoupling, and persistent storage
          </p>
        </div>

        {/* Visual Flow Representation */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-6">
          {/* Level 1: Frontend Client */}
          <div className="max-w-md mx-auto bg-white border border-slate-300 rounded-lg p-3 text-center shadow-xs">
            <div className="text-xs font-bold text-slate-900">
              React + Vite Frontend (Port 3000 / Port 80)
            </div>
            <div className="text-[11px] text-slate-500">
              Single-Page Application · Tailwind CSS · Axios REST client
            </div>
          </div>

          {/* Connection Down */}
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div className="h-4 w-px bg-slate-300" />
            <div className="text-[11px] font-mono text-slate-500 px-2 py-0.5 bg-slate-200 rounded my-1">
              REST HTTP Requests (/api/*)
            </div>
            <div className="h-4 w-px bg-slate-300" />
          </div>

          {/* Level 2: API Gateway */}
          <div className="max-w-md mx-auto bg-slate-900 text-white rounded-lg p-3.5 text-center shadow-sm">
            <div className="text-xs font-bold tracking-wide uppercase text-blue-400">
              API Gateway (Port 8080)
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Single Entry Point · Health Prober · Path Routing
            </div>
          </div>

          {/* Connection Split */}
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div className="h-4 w-px bg-slate-300" />
            <div className="text-[11px] font-mono text-slate-500 px-2 py-0.5 bg-slate-200 rounded my-1">
              Internal Microservice REST Routing
            </div>
            <div className="h-4 w-px bg-slate-300" />
          </div>

          {/* Level 3: Three Microservices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Book Service */}
            <div className="bg-white border border-blue-200 rounded-lg p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-900">Book Service</span>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  Port 4001
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Handles book CRUD, search queries, and atomic inventory decrement.
              </p>
            </div>

            {/* Borrow Service */}
            <div className="bg-white border border-emerald-200 rounded-lg p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-900">Borrow Service</span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Port 4002
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Orchestrates lending rules, calls Book Service and emits to Notification Service.
              </p>
            </div>

            {/* Notification Service */}
            <div className="bg-white border border-indigo-200 rounded-lg p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-900">Notification Service</span>
                <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Port 4003
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Receives automated events from Borrow Service and persists audit log.
              </p>
            </div>
          </div>

          {/* Inter-service call notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>
              <strong>Inter-Service REST:</strong> Borrow Service (4002) calls{' '}
              <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
                PATCH /books/:id/inventory
              </code>{' '}
              on Book Service (4001) using Axios.
            </span>
          </div>

          {/* Connection to DB */}
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div className="h-4 w-px bg-slate-300" />
            <div className="text-[11px] font-mono text-slate-500 px-2 py-0.5 bg-slate-200 rounded my-1">
              Mongoose Database Connections
            </div>
            <div className="h-4 w-px bg-slate-300" />
          </div>

          {/* Level 4: Database */}
          <div className="max-w-md mx-auto bg-white border border-slate-300 rounded-lg p-3 text-center shadow-xs">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>MongoDB 7.0 Persistent Storage (Port 27017)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Collections: <span className="font-mono text-slate-700">books</span>,{' '}
              <span className="font-mono text-slate-700">borrowings</span>,{' '}
              <span className="font-mono text-slate-700">notifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment & Scalability Reference Box */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            Kubernetes Horizontal Pod Autoscaling (HPA) Demo
          </h4>
          <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            Minikube / EC2
          </span>
        </div>
        <p className="text-xs text-slate-300">
          To demonstrate stateless service scalability for mini project evaluation, run this command in your terminal:
        </p>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 select-all">
          kubectl scale deployment book-service --replicas=3
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>
            Kubernetes creates 3 load-balanced replica pods behind the ClusterIP service at{' '}
            <code className="text-slate-200">book-service:4001</code>.
          </span>
        </div>
      </div>
    </div>
  );
};
