/*
 *  Document   : be_comp_charts.js
 *  Author     : pixelcave
 *  Description: Custom JS code used in Charts Page
 */

// Full Calendar, for more examples you can check out http://fullcalendar.io/
class pageCompCharts {
    /*
    * Chart.js Charts, for more examples you can check out http://www.chartjs.org/docs
    *
    */
    static initChartsChartJS() {
        // Set Global Chart.js configuration (Chart.js v3+ syntax)
        // Verificar que Chart.js esté cargado correctamente
        if (typeof Chart === 'undefined') {
            return; // Chart.js no está cargado, salir silenciosamente
        }
        
        // Configurar defaults solo si existen (evita errores de compatibilidad)
        try {
            if (Chart.defaults) {
                Chart.defaults.color = '#999';
                if (Chart.defaults.font) {
                    Chart.defaults.font.weight = '600';
                }
                if (Chart.defaults.scale && Chart.defaults.scale.grid) {
                    Chart.defaults.scale.grid.color = "rgba(0,0,0,.05)";
                    Chart.defaults.scale.grid.zeroLineColor = "rgba(0,0,0,.1)";
                }
                if (Chart.defaults.scale && Chart.defaults.scale.ticks) {
                    Chart.defaults.scale.ticks.beginAtZero = true;
                }
                if (Chart.defaults.elements) {
                    if (Chart.defaults.elements.line) {
                        Chart.defaults.elements.line.borderWidth = 2;
                    }
                    if (Chart.defaults.elements.point) {
                        Chart.defaults.elements.point.radius = 4;
                        Chart.defaults.elements.point.hoverRadius = 6;
                    }
                }
                if (Chart.defaults.plugins) {
                    if (Chart.defaults.plugins.tooltip) {
                        Chart.defaults.plugins.tooltip.cornerRadius = 3;
                    }
                    if (Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
                        Chart.defaults.plugins.legend.labels.boxWidth = 15;
                    }
                }
            }
        } catch (e) {
            // Ignorar errores de configuración de Chart.js
        }

        // Get Chart Containers
        let chartLinesCon  = jQuery('.js-chartjs-lines');
        let chartBarsCon   = jQuery('.js-chartjs-bars');
        let chartRadarCon  = jQuery('.js-chartjs-radar');
        let chartPolarCon  = jQuery('.js-chartjs-polar');
        let chartPieCon    = jQuery('.js-chartjs-pie');
        let chartDonutCon  = jQuery('.js-chartjs-donut');

        // Set Chart and Chart Data variables
        let chartLines, chartBars, chartRadar, chartPolar, chartPie, chartDonut;
        let chartLinesBarsRadarData, chartPolarPieDonutData;

        // Lines/Bar/Radar Chart Data
        chartLinesBarsRadarData = {
            labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
            datasets: [
                {
                    label: 'This Week',
                    fill: true,
                    backgroundColor: 'rgba(220,220,220,.3)',
                    borderColor: 'rgba(220,220,220,1)',
                    pointBackgroundColor: 'rgba(220,220,220,1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(220,220,220,1)',
                    data: [30, 32, 40, 45, 43, 38, 55]
                },
                {
                    label: 'Last Week',
                    fill: true,
                    backgroundColor: 'rgba(171, 227, 125, .3)',
                    borderColor: 'rgba(171, 227, 125, 1)',
                    pointBackgroundColor: 'rgba(171, 227, 125, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(171, 227, 125, 1)',
                    data: [15, 16, 20, 25, 23, 25, 32]
                }
            ]
        };

        // Polar/Pie/Donut Data
        chartPolarPieDonutData = {
            labels: [
                'Earnings',
                'Sales',
                'Tickets'
            ],
            datasets: [{
                data: [
                    48,
                    26,
                    26
                ],
                backgroundColor: [
                    'rgba(171, 227, 125, 1)',
                    'rgba(250, 219, 125, 1)',
                    'rgba(117, 176, 235, 1)'
                ],
                hoverBackgroundColor: [
                    'rgba(171, 227, 125, .75)',
                    'rgba(250, 219, 125, .75)',
                    'rgba(117, 176, 235, .75)'
                ]
            }]
        };

        // Init Charts
        if (chartLinesCon.length) {
            chartLines = new Chart(chartLinesCon, { type: 'line', data: chartLinesBarsRadarData });
        }

        if (chartBarsCon.length) {
            chartBars  = new Chart(chartBarsCon, { type: 'bar', data: chartLinesBarsRadarData });
        }

        if (chartRadarCon.length) {
            chartRadar = new Chart(chartRadarCon, { type: 'radar', data: chartLinesBarsRadarData });
        }

        if (chartPolarCon.length) {
            chartPolar = new Chart(chartPolarCon, { type: 'polarArea', data: chartPolarPieDonutData });
        }

        if (chartPieCon.length) {
            chartPie   = new Chart(chartPieCon, { type: 'pie', data: chartPolarPieDonutData });
        }

        if (chartDonutCon.length) {
            chartDonut = new Chart(chartDonutCon, { type: 'doughnut', data: chartPolarPieDonutData });
        }
    }

    /*
    * Randomize Easy Pie Chart values
    *
    */
    static initRandomEasyPieChart() {
        jQuery('.js-pie-randomize').on('click', e => {
            jQuery(e.currentTarget)
                .parents('.block')
                .find('.pie-chart')
                .each((index, element) => jQuery(element).data('easyPieChart').update(Math.floor((Math.random() * 100) + 1)));
        });
    }

    /*
    * Init functionality
    *
    */
    static init() {
        this.initChartsChartJS();
        this.initRandomEasyPieChart();
    }
}

// Initialize when page loads
jQuery(() => { pageCompCharts.init(); });

