import os
import json
import httpx
from typing import Dict, Any, Optional

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

class DeepSeekClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.model = "deepseek-chat"

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    def analyze_blocker(self, objective: str, evidences: list, failed_attempts: list) -> Dict[str, Any]:
        """
        Sends blocker context to DeepSeek to obtain root cause diagnosis.
        Handles API errors, invalid responses, and timeouts safely.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "DeepSeek API key no configurada en el entorno.",
                "root_cause": "No se pudo consultar el modelo por falta de credenciales.",
                "confidence": 0.0
            }

        prompt = f"""Eres el asesor técnico de Solution Navigator.
Analiza este bloqueo técnico sin inventar hechos:
OBJETIVO: {objective}

INTENTOS FALLIDOS PREVIOS:
{json.dumps([a.dict() if hasattr(a, 'dict') else a for a in failed_attempts], indent=2)}

EVIDENCIAS TÉCNICAS:
{json.dumps([e.dict() if hasattr(e, 'dict') else e for e in evidences], indent=2)}

Responde en formato JSON estricto con:
{{
  "root_cause": "Explicación precisa de la causa raíz",
  "confidence": 0.85,
  "proven_facts": ["hecho 1", "hecho 2"],
  "hypotheses": ["hipotesis 1"],
  "missing_info": ["dato faltante si aplica"],
  "confirmed_limitations": ["limite de entorno si aplica"]
}}"""

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    DEEPSEEK_API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "Responde estrictamente con JSON válido."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.2
                    }
                )
                if resp.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Error de API DeepSeek (HTTP {resp.status_code}): {resp.text[:200]}",
                        "root_cause": "Fallo de comunicación con DeepSeek API.",
                        "confidence": 0.0
                    }

                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                # Remove possible markdown fences
                if content.startswith("```"):
                    content = content.split("\n", 1)[1]
                    if content.endswith("```"):
                        content = content.rsplit("```", 1)[0]
                parsed = json.loads(content)
                parsed["success"] = True
                return parsed

        except json.JSONDecodeError as jde:
            return {
                "success": False,
                "error": f"Respuesta no válida del modelo: {str(jde)}",
                "root_cause": "El modelo no devolvió un JSON bien formado.",
                "confidence": 0.0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error de conexión: {str(e)}",
                "root_cause": "Excepción durante la invocación del modelo.",
                "confidence": 0.0
            }

    def generate_seven_alternatives(self, objective: str, requirements: list, blocker_info: dict) -> Dict[str, Any]:
        """
        Requests exactly seven distinct technical alternatives from DeepSeek.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "DeepSeek API key no configurada en el entorno.",
                "alternatives": []
            }

        prompt = f"""Genera EXACTAMENTE SIETE alternativas técnicas viables y diferenciadas para cumplir este objetivo:
OBJETIVO: {objective}
REQUISITOS OBLIGATORIOS: {json.dumps(requirements)}
CAUSA DEL BLOQUEO: {blocker_info.get('root_cause', '')}

Las 7 alternativas deben explorar categorías técnicas distintas (REPAIR, SIMPLIFICATION, SUBSTITUTION, TECH_CHANGE, ARCH_REDESIGN, HYBRID, PATH_REDESIGN).
Responde en formato JSON estricto con un arreglo 'alternatives' de 7 objetos:
{{
  "alternatives": [
    {{
      "id": "alt-1",
      "title": "Título descriptivo",
      "category": "REPAIR",
      "description": "Detalle técnico de cómo cumple el objetivo",
      "pros": ["ventaja 1"],
      "cons": ["desventaja o riesgo"],
      "dependencies": ["librería o requisito"],
      "estimated_cost": "Bajo/Medio/Alto",
      "effort": "X horas",
      "confidence": "ESTIMADA",
      "criteria_estimates": {{
        "objective_compliance": 4.5,
        "technical_feasibility": 4.0,
        "implementation_risk": 3.5,
        "time_effort": 4.0,
        "operational_cost": 5.0,
        "maintainability": 4.0
      }}
    }}
  ]
}}"""

        try:
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(
                    DEEPSEEK_API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "Responde estrictamente con JSON válido conteniendo exactamente 7 alternativas."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    }
                )
                if resp.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Error de API DeepSeek (HTTP {resp.status_code}): {resp.text[:200]}",
                        "alternatives": []
                    }

                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[1]
                    if content.endswith("```"):
                        content = content.rsplit("```", 1)[0]
                parsed = json.loads(content)
                parsed["success"] = True
                return parsed

        except Exception as e:
            return {
                "success": False,
                "error": f"Error durante la generación de alternativas: {str(e)}",
                "alternatives": []
            }

default_deepseek_client = DeepSeekClient()
