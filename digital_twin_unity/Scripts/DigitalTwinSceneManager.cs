using System.Collections.Generic;
using UnityEngine;

namespace GramX.DigitalTwin
{
    public class DigitalTwinSceneManager : MonoBehaviour
    {
        [Header("Mesh Prefabs")]
        public GameObject handpumpPrefab;
        public GameObject transformerPrefab;
        public GameObject drainPipePrefab;
        public GameObject defaultAssetPrefab;

        private readonly Dictionary<string, GameObject> spawnedNodes = new Dictionary<string, GameObject>();

        private void Start()
        {
            LoadSceneData();
        }

        public void LoadSceneData()
        {
            if (GramXApiClient.Instance == null) return;

            GramXApiClient.Instance.FetchSpatialScene(
                onSuccess: (scene) =>
                {
                    Debug.Log($"[DigitalTwin] Scene Loaded: {scene.scene_name} with {scene.total_nodes} nodes.");
                    Build3DInfrastructure(scene.nodes);
                },
                onError: (err) =>
                {
                    Debug.LogWarning($"[DigitalTwin] API Error (Falling back to simulated procedural mesh): {err}");
                    GenerateFallbackDemoScene();
                }
            );
        }

        private void Build3DInfrastructure(SceneNodeData[] nodes)
        {
            // Clear existing
            foreach (var kvp in spawnedNodes)
            {
                if (kvp.Value != null) Destroy(kvp.Value);
            }
            spawnedNodes.Clear();

            if (nodes == null) return;

            foreach (var n in nodes)
            {
                GameObject prefab = GetPrefabForType(n.asset_type);
                Vector3 pos = new Vector3(n.position_3d.x, n.position_3d.y, n.position_3d.z);
                
                GameObject instance = Instantiate(prefab, pos, Quaternion.identity, transform);
                instance.name = n.node_id;

                // Color tint renderer based on health
                Renderer rend = instance.GetComponentInChildren<Renderer>();
                if (rend != null && ColorUtility.TryParseHtmlString(n.status_color_hex, out Color col))
                {
                    rend.material.color = col;
                }

                spawnedNodes[n.node_id] = instance;
            }
        }

        private GameObject GetPrefabForType(string assetType)
        {
            switch (assetType?.ToLower())
            {
                case "water": return handpumpPrefab ? handpumpPrefab : GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                case "electricity": return transformerPrefab ? transformerPrefab : GameObject.CreatePrimitive(PrimitiveType.Cube);
                case "drainage": return drainPipePrefab ? drainPipePrefab : GameObject.CreatePrimitive(PrimitiveType.Capsule);
                default: return defaultAssetPrefab ? defaultAssetPrefab : GameObject.CreatePrimitive(PrimitiveType.Sphere);
            }
        }

        private void GenerateFallbackDemoScene()
        {
            // Fallback procedural demo grid for offline preview
            for (int i = 0; i < 6; i++)
            {
                Vector3 pos = new Vector3((i % 3) * 30.0f - 30.0f, 0, (i / 3) * 30.0f - 15.0f);
                GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
                cube.transform.position = pos;
                cube.name = $"DEMO-NODE-{i + 1}";
                cube.GetComponent<Renderer>().material.color = (i % 2 == 0) ? Color.green : Color.yellow;
                spawnedNodes[cube.name] = cube;
            }
        }
    }
}
