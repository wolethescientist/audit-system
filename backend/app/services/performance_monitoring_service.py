"""
Performance Monitoring Service for ISO Audit System

This service provides comprehensive performance monitoring and optimization:
- Real-time performance metrics collection
- Database query optimization
- Resource usage monitoring
- Bottleneck identification and alerting
- Performance trend analysis

Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
"""

import logging
import time
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict, deque
import psutil
import threading
from sqlalchemy import text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal
from app.services.system_integration_service import system_integration_service

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Data class for performance metrics."""
    name: str
    value: float
    unit: str
    timestamp: datetime
    category: str
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None

@dataclass
class QueryPerformanceData:
    """Data class for database query performance."""
    query_hash: str
    query_text: str
    execution_count: int
    total_duration: float
    avg_duration: float
    max_duration: float
    min_duration: float
    last_executed: datetime

class PerformanceMonitoringService:
    """
    Comprehensive performance monitoring service.
    
    Monitors:
    - System resource usage (CPU, memory, disk)
    - Database performance and query optimization
    - API response times and throughput
    - Background task performance
    - User session metrics
    """
    
    def __init__(self):
        """Initialize performance monitoring service."""
        self.metrics_history = defaultdict(lambda: deque(maxlen=1000))
        self.query_performance = {}
        self.active_sessions = {}
        self.performance_alerts = []
        self.monitoring_active = False
        self.monitoring_thread = None
        
        # Performance thresholds
        self.thresholds = {
            'cpu_percent': {'warning': 70.0, 'critical': 90.0},
            'memory_percent': {'warning': 80.0, 'critical': 95.0},
            'disk_percent': {'warning': 85.0, 'critical': 95.0},
            'response_time_ms': {'warning': 2000.0, 'critical': 5000.0},
            'db_query_time_ms': {'warning': 1000.0, 'critical': 3000.0},
            'db_connections': {'warning': 80.0, 'critical': 95.0}
        }
        
        # Setup database query monitoring
        self._setup_query_monitoring()
    
    def _setup_query_monitoring(self):
        """Setup SQLAlchemy event listeners for query monitoring."""
        
        @event.listens_for(Engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            context._query_start_time = time.time()
        
        @event.listens_for(Engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            total_time = time.time() - context._query_start_time
            
            # Log slow queries
            if total_time > 1.0:  # Queries taking more than 1 second
                logger.warning(f"Slow query detected: {total_time:.3f}s - {statement[:100]}...")
                
                # Store query performance data
                query_hash = str(hash(statement))
                if query_hash not in self.query_performance:
                    self.query_performance[query_hash] = QueryPerformanceData(
                        query_hash=query_hash,
                        query_text=statement[:500],  # Truncate for storage
                        execution_count=0,
                        total_duration=0.0,
                        avg_duration=0.0,
                        max_duration=0.0,
                        min_duration=float('inf'),
                        last_executed=datetime.utcnow()
                    )
                
                perf_data = self.query_performance[query_hash]
                perf_data.execution_count += 1
                perf_data.total_duration += total_time
                perf_data.avg_duration = perf_data.total_duration / perf_data.execution_count
                perf_data.max_duration = max(perf_data.max_duration, total_time)
                perf_data.min_duration = min(perf_data.min_duration, total_time)
                perf_data.last_executed = datetime.utcnow()
    
    def start_monitoring(self):
        """Start background performance monitoring."""
        if not self.monitoring_active:
            self.monitoring_active = True
            self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
            self.monitoring_thread.start()
            logger.info("Performance monitoring started")
    
    def stop_monitoring(self):
        """Stop background performance monitoring."""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        logger.info("Performance monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop running in background thread."""
        while self.monitoring_active:
            try:
                # Collect system metrics
                self._collect_system_metrics()
                
                # Collect database metrics
                self._collect_database_metrics()
                
                # Check for performance alerts
                self._check_performance_alerts()
                
                # Sleep for monitoring interval
                time.sleep(30)  # Collect metrics every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in performance monitoring loop: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def _collect_system_metrics(self):
        """Collect system resource metrics."""
        try:
            now = datetime.utcnow()
            
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            self._add_metric('cpu_percent', cpu_percent, 'percent', now, 'system')
            
            # Memory metrics
            memory = psutil.virtual_memory()
            self._add_metric('memory_percent', memory.percent, 'percent', now, 'system')
            self._add_metric('memory_available_gb', memory.available / (1024**3), 'GB', now, 'system')
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            self._add_metric('disk_percent', disk.percent, 'percent', now, 'system')
            self._add_metric('disk_free_gb', disk.free / (1024**3), 'GB', now, 'system')
            
            # Network metrics
            network = psutil.net_io_counters()
            self._add_metric('network_bytes_sent', network.bytes_sent, 'bytes', now, 'network')
            self._add_metric('network_bytes_recv', network.bytes_recv, 'bytes', now, 'network')
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {str(e)}")
    
    def _collect_database_metrics(self):
        """Collect database performance metrics."""
        try:
            now = datetime.utcnow()
            
            # Connection pool metrics (handle NullPool)
            pool = engine.pool
            
            # Check if pool has size/overflow methods (not available in NullPool)
            if hasattr(pool, 'size') and hasattr(pool, 'overflow'):
                total_connections = pool.size() + pool.overflow()
                active_connections = pool.checkedout()
                
                if total_connections > 0:
                    connection_usage = (active_connections / total_connections) * 100
                    self._add_metric('db_connection_usage_percent', connection_usage, 'percent', now, 'database')
                
                self._add_metric('db_active_connections', active_connections, 'count', now, 'database')
                self._add_metric('db_pool_size', pool.size(), 'count', now, 'database')
                self._add_metric('db_overflow', pool.overflow(), 'count', now, 'database')
            else:
                # For NullPool, we can only track checked out connections
                if hasattr(pool, 'checkedout'):
                    active_connections = pool.checkedout()
                    self._add_metric('db_active_connections', active_connections, 'count', now, 'database')
                
                # Log that we're using NullPool (no connection pooling)
                self._add_metric('db_pool_type', 0, 'nullpool', now, 'database')
            
            # Database query metrics
            db = SessionLocal()
            try:
                # Get database size
                result = db.execute(text("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                           pg_database_size(current_database()) as size_bytes
                """)).fetchone()
                
                if result:
                    self._add_metric('db_size_bytes', result.size_bytes, 'bytes', now, 'database')
                
                # Get active queries count
                active_queries = db.execute(text("""
                    SELECT COUNT(*) as count 
                    FROM pg_stat_activity 
                    WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
                """)).scalar()
                
                self._add_metric('db_active_queries', active_queries, 'count', now, 'database')
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to collect database metrics: {str(e)}")
    
    def _add_metric(self, name: str, value: float, unit: str, timestamp: datetime, category: str):
        """Add a metric to the history."""
        threshold_config = self.thresholds.get(name, {})
        
        metric = PerformanceMetric(
            name=name,
            value=value,
            unit=unit,
            timestamp=timestamp,
            category=category,
            threshold_warning=threshold_config.get('warning'),
            threshold_critical=threshold_config.get('critical')
        )
        
        self.metrics_history[name].append(metric)
    
    def _check_performance_alerts(self):
        """Check for performance threshold violations and create alerts."""
        try:
            current_time = datetime.utcnow()
            
            for metric_name, metrics in self.metrics_history.items():
                if not metrics:
                    continue
                
                latest_metric = metrics[-1]
                
                # Check critical threshold
                if (latest_metric.threshold_critical and 
                    latest_metric.value >= latest_metric.threshold_critical):
                    
                    alert = {
                        'level': 'critical',
                        'metric': metric_name,
                        'value': latest_metric.value,
                        'threshold': latest_metric.threshold_critical,
                        'unit': latest_metric.unit,
                        'timestamp': current_time,
                        'message': f"Critical: {metric_name} is {latest_metric.value}{latest_metric.unit} "
                                 f"(threshold: {latest_metric.threshold_critical}{latest_metric.unit})"
                    }
                    
                    self._create_performance_alert(alert)
                
                # Check warning threshold
                elif (latest_metric.threshold_warning and 
                      latest_metric.value >= latest_metric.threshold_warning):
                    
                    alert = {
                        'level': 'warning',
                        'metric': metric_name,
                        'value': latest_metric.value,
                        'threshold': latest_metric.threshold_warning,
                        'unit': latest_metric.unit,
                        'timestamp': current_time,
                        'message': f"Warning: {metric_name} is {latest_metric.value}{latest_metric.unit} "
                                 f"(threshold: {latest_metric.threshold_warning}{latest_metric.unit})"
                    }
                    
                    self._create_performance_alert(alert)
                    
        except Exception as e:
            logger.error(f"Failed to check performance alerts: {str(e)}")
    
    def _create_performance_alert(self, alert: Dict[str, Any]):
        """Create and log a performance alert."""
        
        # Avoid duplicate alerts (same metric within 5 minutes)
        recent_alerts = [
            a for a in self.performance_alerts 
            if (a['metric'] == alert['metric'] and 
                a['level'] == alert['level'] and
                (alert['timestamp'] - a['timestamp']).total_seconds() < 300)
        ]
        
        if not recent_alerts:
            self.performance_alerts.append(alert)
            
            # Log the alert
            if alert['level'] == 'critical':
                logger.critical(alert['message'])
            else:
                logger.warning(alert['message'])
            
            # Keep only last 100 alerts
            if len(self.performance_alerts) > 100:
                self.performance_alerts = self.performance_alerts[-100:]
    
    async def get_current_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        try:
            current_metrics = {}
            
            for metric_name, metrics in self.metrics_history.items():
                if metrics:
                    latest = metrics[-1]
                    current_metrics[metric_name] = {
                        'value': latest.value,
                        'unit': latest.unit,
                        'timestamp': latest.timestamp.isoformat(),
                        'category': latest.category,
                        'status': self._get_metric_status(latest)
                    }
            
            return {
                'metrics': current_metrics,
                'alerts_count': len(self.performance_alerts),
                'monitoring_active': self.monitoring_active,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get current metrics: {str(e)}")
            return {'error': str(e)}
    
    def _get_metric_status(self, metric: PerformanceMetric) -> str:
        """Determine status of a metric based on thresholds."""
        if metric.threshold_critical and metric.value >= metric.threshold_critical:
            return 'critical'
        elif metric.threshold_warning and metric.value >= metric.threshold_warning:
            return 'warning'
        else:
            return 'normal'
    
    async def get_performance_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get performance trends over specified time period."""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            trends = {}
            
            for metric_name, metrics in self.metrics_history.items():
                # Filter metrics within time range
                recent_metrics = [
                    m for m in metrics 
                    if m.timestamp >= cutoff_time
                ]
                
                if len(recent_metrics) >= 2:
                    values = [m.value for m in recent_metrics]
                    timestamps = [m.timestamp.isoformat() for m in recent_metrics]
                    
                    trends[metric_name] = {
                        'values': values,
                        'timestamps': timestamps,
                        'min': min(values),
                        'max': max(values),
                        'avg': sum(values) / len(values),
                        'current': values[-1],
                        'trend': 'increasing' if values[-1] > values[0] else 'decreasing',
                        'unit': recent_metrics[0].unit,
                        'category': recent_metrics[0].category
                    }
            
            return {
                'trends': trends,
                'period_hours': hours,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get performance trends: {str(e)}")
            return {'error': str(e)}
    
    async def get_slow_queries(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get slowest database queries."""
        try:
            # Sort queries by average duration
            sorted_queries = sorted(
                self.query_performance.values(),
                key=lambda q: q.avg_duration,
                reverse=True
            )
            
            slow_queries = []
            for query in sorted_queries[:limit]:
                slow_queries.append({
                    'query_hash': query.query_hash,
                    'query_text': query.query_text,
                    'execution_count': query.execution_count,
                    'avg_duration_ms': round(query.avg_duration * 1000, 2),
                    'max_duration_ms': round(query.max_duration * 1000, 2),
                    'total_duration_ms': round(query.total_duration * 1000, 2),
                    'last_executed': query.last_executed.isoformat()
                })
            
            return slow_queries
            
        except Exception as e:
            logger.error(f"Failed to get slow queries: {str(e)}")
            return []
    
    async def get_performance_alerts(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get performance alerts from specified time period."""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            recent_alerts = [
                alert for alert in self.performance_alerts
                if alert['timestamp'] >= cutoff_time
            ]
            
            # Sort by timestamp (most recent first)
            recent_alerts.sort(key=lambda a: a['timestamp'], reverse=True)
            
            # Convert timestamps to ISO format for JSON serialization
            for alert in recent_alerts:
                alert['timestamp'] = alert['timestamp'].isoformat()
            
            return recent_alerts
            
        except Exception as e:
            logger.error(f"Failed to get performance alerts: {str(e)}")
            return []
    
    async def optimize_performance(self, db: Session) -> Dict[str, Any]:
        """Perform automated performance optimizations."""
        optimization_results = {
            'optimizations_performed': [],
            'recommendations': [],
            'performance_impact': {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            # Clear query performance cache if it gets too large
            if len(self.query_performance) > 1000:
                # Keep only the most recent 500 queries
                sorted_queries = sorted(
                    self.query_performance.items(),
                    key=lambda x: x[1].last_executed,
                    reverse=True
                )
                
                self.query_performance = dict(sorted_queries[:500])
                optimization_results['optimizations_performed'].append(
                    "Cleared old query performance data"
                )
            
            # Database maintenance
            db_optimizations = await system_integration_service.optimize_database_performance(db)
            optimization_results['optimizations_performed'].extend(
                db_optimizations.get('operations_performed', [])
            )
            
            if 'recommendations' in db_optimizations:
                optimization_results['recommendations'].extend(
                    db_optimizations['recommendations']
                )
            
            # Memory cleanup recommendations
            memory_metrics = [m for m in self.metrics_history.get('memory_percent', []) if m]
            if memory_metrics and memory_metrics[-1].value > 80:
                optimization_results['recommendations'].append(
                    "High memory usage detected. Consider restarting the application or scaling resources."
                )
            
            # CPU optimization recommendations
            cpu_metrics = [m for m in self.metrics_history.get('cpu_percent', []) if m]
            if cpu_metrics and cpu_metrics[-1].value > 80:
                optimization_results['recommendations'].append(
                    "High CPU usage detected. Consider optimizing queries or scaling resources."
                )
            
        except Exception as e:
            logger.error(f"Performance optimization failed: {str(e)}")
            optimization_results['error'] = str(e)
        
        return optimization_results

# Global instance
performance_monitoring_service = PerformanceMonitoringService()