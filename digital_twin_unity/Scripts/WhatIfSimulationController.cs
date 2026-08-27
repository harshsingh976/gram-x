using System;
using UnityEngine;
using UnityEngine.UIElements;

namespace GramX.DigitalTwin
{
    public class WhatIfSimulationController : MonoBehaviour
    {
        [Header("UI Document Reference")]
        public UIDocument uiDocument;

        private Slider surgeSlider;
        private Button runSimulationButton;
        private Label kpiStatusLabel;

        private void OnEnable()
        {
            if (uiDocument == null) return;
            var root = uiDocument.rootVisualElement;

            surgeSlider = root.Q<Slider>("surge-slider");
            runSimulationButton = root.Q<Button>("run-simulation-btn");
            kpiStatusLabel = root.Q<Label>("kpi-status-label");

            if (runSimulationButton != null)
            {
                runSimulationButton.clicked += OnRunSimulationClicked;
            }
        }

        private void OnRunSimulationClicked()
        {
            float surgeVal = surgeSlider != null ? surgeSlider.value : 30.0f;
            if (kpiStatusLabel != null)
            {
                kpiStatusLabel.text = $"Simulating +{surgeVal}% load... SLA Buffer Active.";
            }
            Debug.Log($"[DigitalTwin] What-If Simulation Triggered: +{surgeVal}% load factor.");
        }
    }
}
