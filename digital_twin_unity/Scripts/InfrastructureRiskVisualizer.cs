using UnityEngine;

namespace GramX.DigitalTwin
{
    public class InfrastructureRiskVisualizer : MonoBehaviour
    {
        [Header("Particle Systems")]
        public ParticleSystem waterLeakParticles;
        public ParticleSystem transformerSparkParticles;
        public ParticleSystem floodZoneParticles;

        public void TriggerWaterBurstEffect(Vector3 position)
        {
            if (waterLeakParticles != null)
            {
                waterLeakParticles.transform.position = position;
                waterLeakParticles.Play();
            }
        }

        public void TriggerTransformerArcEffect(Vector3 position)
        {
            if (transformerSparkParticles != null)
            {
                transformerSparkParticles.transform.position = position;
                transformerSparkParticles.Play();
            }
        }
    }
}
